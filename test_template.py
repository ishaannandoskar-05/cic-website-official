import json

user_code = open('test_user_code.py').read()
args_json = '["()"]'
function_name = 'isValid'

source = f'''
import json

{user_code}

_args = json.loads({json.dumps(args_json)})
_result = {function_name}(*_args)
print(json.dumps(_result, separators=(',', ':')))
'''

print(source)