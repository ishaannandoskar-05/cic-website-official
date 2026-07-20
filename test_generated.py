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

_args = json.loads("[\"()\"]")
_result = isValid(*_args)
print(json.dumps(_result, separators=(',', ':')))