import sys
import json

def isValid(s: str) -> bool:
    stack = []
    mapping = {')': '(', '}': '{', ']': '['}
    
    for char in s:
        if char in mapping:
            top_element = stack.pop() if stack else '#'
            if mapping[char] != top_element:
                return False
        else:
            stack.append(char)
    
    return not stack

def solve(args):
    s = args[0]
    return isValid(s)

if __name__ == "__main__":
    import sys
    import json
    
    if len(sys.argv) > 1:
        args = json.loads(sys.argv[1])
        result = solve(args)
        print(json.dumps(result))

# Test cases
if __name__ == "__main__":
    test_cases = [
        ("()", True),
        ("()[]{}", True),
        ("(]", False),
        ("([])", True),
        ("", True),
        ("{[]}", True),
        ("([)]", False),
    ]
    
    for s, expected in test_cases:
        result = isValid(s)
        status = "PASS" if result == expected else "FAIL"
        print(f"{status}: isValid('{s}') = {result}, expected {expected}")