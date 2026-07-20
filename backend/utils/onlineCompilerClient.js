import axios from 'axios';

const JUDGE0_API = 'https://judge0-ce.p.rapidapi.com';
const JUDGE0_KEY = process.env.JUDGE0_API_KEY || '';
const USE_RAPIDAPI = !!JUDGE0_KEY;

const LANGUAGE_MAP = {
  Python: { id: 71, name: 'Python (3.8.1)' },
  Java: { id: 62, name: 'Java (OpenJDK 13.0.1)' },
  C: { id: 50, name: 'C (GCC 9.2.0)' },
  'C++': { id: 54, name: 'C++ (GCC 9.2.0)' },
};

const JAVA_TYPES = {
  int: 'int',
  'int[]': 'int[]',
  'int[][]': 'int[][]',
  string: 'String',
  bool: 'boolean',
};

const generateJavaValue = (type, value) => {
  switch (type) {
    case 'int':
      return `${value}`;
    case 'bool':
      return value ? 'true' : 'false';
    case 'int[]':
      return `new int[]{${value.join(',')}}`;
    case 'int[][]':
      return `new int[][]{${value.map((row) => `{${row.join(',')}}`).join(',')}}`;
    case 'string':
      return `"${value}"`;
    default:
      throw new Error(`Unsupported Java type ${type}`);
  }
};

export const normalise = (s = '') =>
  String(s)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\s+/g, '')
    .trim();

export const buildSource = (language, userCode, argsJson, quest) => {
  const args = JSON.parse(argsJson || '[]');
  const functionName = quest?.functionName || 'solve';
  const returnType = quest?.returnType || 'int';
  const parameters = quest?.parameters || [];

  if (!functionName) throw new Error('Missing functionName in quest schema');
  if (!Array.isArray(parameters)) throw new Error('Invalid parameters schema: expected an array');

  switch (language) {
    case 'Python':
      return `
import json

${userCode}

_args = json.loads(${JSON.stringify(argsJson)})
_result = ${functionName}(*_args)
print(json.dumps(_result, separators=(',', ':')))
`;

    case 'Java': {
      const variables = [];
      parameters.forEach((param, index) => {
        variables.push(
          `${JAVA_TYPES[param.type]} ${param.name} = ${generateJavaValue(param.type, args[index])};`
        );
      });
      const parameterNames = parameters.map((p) => p.name).join(',');
      return `
import java.util.*;

${userCode}

class Main {
  static void printResult(Object result) {
    if (result instanceof int[]) {
      System.out.print(java.util.Arrays.toString((int[]) result));
      return;
    }
    if (result instanceof int[][]) {
      System.out.print(java.util.Arrays.deepToString((int[][]) result));
      return;
    }
    System.out.print(result);
  }

  public static void main(String[] args) {
    ${variables.join('\n    ')}
    ${returnType} result = ${functionName}(${parameterNames});
    printResult(result);
  }
}
`;
    }

    case 'C': {
      const params = parameters.map((p) => p.name).join(', ');
      return `
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

${userCode}

int main() {
  ${parameters.map((p, i) => {
    const val = args[i];
    if (p.type === 'int') return `int ${p.name} = ${val};`;
    if (p.type === 'int[]') return `int ${p.name}[] = {${val.join(',')}}; int ${p.name}_len = ${val.length};`;
    if (p.type === 'int[][]') {
      const rows = val.map((r) => `{${r.join(',')}}`).join(',');
      return `int ${p.name}[][${val[0]?.length || 0}] = {${rows}};`;
    }
    return '';
  }).join('\n  ')}

  ${returnType} result = ${functionName}(${params});
  printf("%d", result);
  return 0;
}
`;
    }

    case 'C++': {
      const params = parameters.map((p) => p.name).join(', ');
      return `
#include <bits/stdc++.h>
using namespace std;

${userCode}

int main() {
  ${parameters.map((p, i) => {
    const val = args[i];
    if (p.type === 'int') return `int ${p.name} = ${val};`;
    if (p.type === 'int[]') return `vector<int> ${p.name} = {${val.join(',')}};`;
    if (p.type === 'int[][]') {
      const rows = val.map((r) => `{${r.join(',')}}`).join(',');
      return `vector<vector<int>> ${p.name} = {${rows}};`;
    }
    return '';
  }).join('\n  ')}

  ${returnType} result = ${functionName}(${params});
  cout << result;
  return 0;
}
`;
    }

    default:
      throw new Error(`Unsupported language: ${language}`);
  }
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const executeCode = async (language, source, stdin = '', timeoutMs = 8000) => {
  const langConfig = LANGUAGE_MAP[language];
  if (!langConfig) throw new Error(`Unsupported language: ${language}`);

  const headers = USE_RAPIDAPI ? {
    'X-RapidAPI-Key': JUDGE0_KEY,
    'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
    'Content-Type': 'application/json',
  } : {
    'Content-Type': 'application/json',
  };

  const baseUrl = USE_RAPIDAPI ? JUDGE0_API : 'https://judge0-ce.p.rapidapi.com';

  try {
    const submitRes = await axios.post(
      `${baseUrl}/submissions?base64_encoded=false&wait=true`,
      {
        language_id: langConfig.id,
        source_code: source,
        stdin: stdin,
        cpu_time_limit: Math.min(Math.ceil(timeoutMs / 1000), 10),
        memory_limit: 256000,
      },
      { headers, timeout: timeoutMs + 5000 }
    );

    const token = submitRes.data.token;

    if (USE_RAPIDAPI) {
      // RapidAPI supports wait=true, so we get result immediately
      const result = submitRes.data;
      if (result.status.id <= 2) {
        return { error: result.stderr || result.compile_output || 'Execution pending', output: result.stdout || '' };
      }
      if (result.status.id === 3) {
        return { error: result.stderr || 'Runtime error', output: result.stdout || '' };
      }
      return { output: result.stdout || '', error: null };
    }

    // For direct Judge0 (without RapidAPI), poll for result
    let attempts = 0;
    const maxAttempts = 20;
    while (attempts < maxAttempts) {
      await sleep(500);
      const resultRes = await axios.get(
        `${baseUrl}/submissions/${token}?base64_encoded=false`,
        { headers, timeout: 10000 }
      );
      const result = resultRes.data;

      if (result.status.id > 2) {
        if (result.status.id === 3) {
          return { error: result.stderr || 'Runtime error', output: result.stdout || '' };
        }
        return { output: result.stdout || '', error: null };
      }
      attempts++;
    }
    return { error: 'Execution timed out', output: '' };
  } catch (err) {
    if (err.response?.data?.message) {
      return { error: err.response.data.message, output: '' };
    }
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      return { error: 'Execution timed out', output: '' };
    }
    return { error: err.message || 'Execution failed', output: '' };
  }
};

export const getRuntimes = async () => {
  return { Python: true, Java: true, C: true, 'C++': true };
};