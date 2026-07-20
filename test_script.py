import sys
import json

sys.argv = ['script.py', '["()"]']
exec(open('script.py').read())