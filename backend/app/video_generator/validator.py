import os
import re
import py_compile
from typing import List, Dict, Any, Tuple, Optional

FORBIDDEN_PATTERNS = [
    {'regex': r'\bCube\s*\(', 'fix': 'Rectangle(', 'reason': '3D Cube not supported, use Rectangle'},
    {'regex': r'\bSphere\s*\(', 'fix': 'Circle(', 'reason': '3D Sphere not supported, use Circle'},
    {'regex': r'\bThreeDScene\b', 'fix': 'Scene', 'reason': 'ThreeDScene not supported, use Scene'},
    {'regex': r'ImageMobject\s*\(\s*["\'][^"\']*["\']\s*\)', 'fix': 'Dot(radius=0.5, color=WHITE)', 'reason': 'ImageMobject with file path not supported'},
    {'regex': r'\bAlwaysRedraw\s*\(', 'fix': 'always_redraw(', 'reason': 'Use lowercase always_redraw()'},
    {'regex': r'self\.duration', 'fix': '4', 'reason': 'self.duration does not exist'},
]

MATHTEX_MISUSE = r'MathTex\s*\(\s*["\']([^"\'\\]*[a-zA-Z ]{5,}[^"\'\\]*)["\']\s*\)'

def check_syntax(file_path: str) -> Tuple[bool, Optional[str]]:
    try:
        py_compile.compile(file_path, doraise=True)
        return True, None
    except py_compile.PyCompileError as err:
        return False, str(err)

def validate_manim_code(file_path: str) -> Dict[str, Any]:
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()
    
    results = {'valid': True, 'issues': [], 'autoFixed': 0}
    if len(code.strip()) < 100 or 'def construct' not in code:
        results['valid'] = False
        return results
        
    valid_syntax, syntax_error = check_syntax(file_path)
    if not valid_syntax:
        results['valid'] = False
        results['issues'].append({'type': 'SYNTAX', 'message': syntax_error})
        return results
        
    fixed_code = code
    fix_count = 0
    for pattern in FORBIDDEN_PATTERNS:
        if pattern['fix']:
            before = fixed_code
            fixed_code = re.sub(pattern['regex'], pattern['fix'], fixed_code)
            if before != fixed_code:
                fix_count += 1
    
    if fix_count > 0:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(fixed_code)
        results['autoFixed'] = fix_count
        
    return results
