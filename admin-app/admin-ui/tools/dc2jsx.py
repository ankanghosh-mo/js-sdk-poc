"""Convert a Design Component page (.dc.html) into a React page component (.jsx).

The markup is copied 1:1 (inline styles, classes, SVGs, texts); only the syntax changes:
  {{ a.b }}            -> {V.a.b} (or {item.b} inside a loop)
  <sc-for list as>     -> {(list || []).map((item, $i) => <Fragment key>...</Fragment>)}
  <sc-if value>        -> {cond ? <>...</> : null}
  style="..."          -> style={css("...")}
  href="X.dc.html"     -> href={route("X.dc.html")}   (hash routes, see routes.js)
The logic class is kept as written: `class Component extends DCLogic` becomes a React class
component with a render() that calls renderVals(), like the design runtime does.

usage: python dc2jsx.py <in.dc.html> <out.jsx> <ComponentName>
"""
import html, json, re, sys

VOID = {'input', 'img', 'br', 'hr', 'meta', 'link', 'source', 'area', 'col', 'wbr'}
RENAME = {
    'class': 'className', 'for': 'htmlFor', 'tabindex': 'tabIndex', 'readonly': 'readOnly',
    'maxlength': 'maxLength', 'colspan': 'colSpan', 'rowspan': 'rowSpan', 'autocomplete': 'autoComplete',
    'autofocus': 'autoFocus', 'spellcheck': 'spellCheck', 'contenteditable': 'contentEditable',
    'crossorigin': 'crossOrigin', 'datetime': 'dateTime', 'viewbox': 'viewBox',
}
DROP = {'hint-placeholder-val', 'hint-placeholder-count', 'hint-size'}
TOKEN = re.compile(r'<!--.*?-->|<(/?)([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^\s=/>]+(?:\s*=\s*(?:"[^"]*"|\'[^\']*\'|[^\s>]+))?)*)\s*(/?)>|([^<]+)', re.S)
ATTR = re.compile(r'([^\s=/>]+)(?:\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+))?')
HOLE = re.compile(r'\{\{\s*([^}]+?)\s*\}\}')


def jattr(name):
    if name.startswith(('aria-', 'data-')):
        return name
    if name in RENAME:
        return RENAME[name]
    if name.startswith('on') and any(c.isupper() for c in name):
        return name  # onClick, onChange, onKeyDown: already JSX
    if '-' in name:  # stroke-width -> strokeWidth
        head, *rest = name.split('-')
        return head + ''.join(p[:1].upper() + p[1:] for p in rest)
    return name


class Conv:
    def __init__(self):
        self.out, self.scopes, self.depth, self.pre = [], [], 0, 0

    def expr(self, path):
        path = path.strip()
        if re.fullmatch(r'true|false|null|-?\d+(\.\d+)?', path) or path[:1] in '\'"':
            return path
        root, _, rest = path.partition('.')
        if root == '$index':
            idx = next((s[1] for s in reversed(self.scopes)), '0')
            return idx + ('.' + rest if rest else '')
        if any(root == s[0] for s in self.scopes):
            return path
        return 'V.' + path

    def value(self, raw):
        """attribute value -> JSX expression (without braces) or None for a plain string"""
        whole = HOLE.fullmatch(raw.strip())
        if whole:
            return self.expr(whole.group(1))
        if '{{' in raw:
            parts = HOLE.split(raw)
            out = []
            for i, p in enumerate(parts):
                out.append(p.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${') if i % 2 == 0 else '${' + self.expr(p) + '}')
            return '`' + ''.join(out) + '`'
        return None

    def attrs(self, raw, tag):
        res = []
        for m in ATTR.finditer(raw):
            name, val = m.group(1), m.group(2)
            if name in DROP:
                continue
            if val is None:
                res.append(jattr(name))
                continue
            if val[:1] in '"\'':
                val = val[1:-1]
            val = html.unescape(val)
            j = jattr(name)
            dyn = self.value(val)
            if name == 'style':
                res.append('style={css(%s)}' % (dyn if dyn else json.dumps(val)))
            elif name == 'href':
                res.append('href={route(%s)}' % (dyn if dyn else json.dumps(val)))
            elif dyn is not None:
                res.append('%s={%s}' % (j, dyn))
            else:
                res.append('%s=%s' % (j, json.dumps(val)))
        return ' '.join(res)

    def text(self, t):
        t = html.unescape(t)
        if not t.strip():
            if self.pre:
                self.out.append('{%s}' % json.dumps(t))
            elif t:
                self.out.append('{" "}' if '\n' not in t else '')
            return
        parts = HOLE.split(t)
        for i, p in enumerate(parts):
            if i % 2 == 0:
                if p:
                    if not self.pre:
                        p = re.sub(r'\s+', ' ', p)
                    self.out.append('{%s}' % json.dumps(p))
            else:
                self.out.append('{%s}' % self.expr(p))

    def run(self, src):
        stack = []
        for m in TOKEN.finditer(src):
            if m.group(0).startswith('<!--'):
                continue
            if m.group(5) is not None:
                self.text(m.group(5))
                continue
            close, tag, raw, selfclose = m.group(1), m.group(2).lower(), m.group(3) or '', m.group(4)
            if tag == 'sc-for':
                if close:
                    stack.pop(); self.scopes.pop()
                    self.out.append('</React.Fragment>))}')
                else:
                    a = {k: (v or '')[1:-1] for k, v in ATTR.findall(raw)}
                    lst = self.value(a['list']) or json.dumps(a['list'])
                    self.depth += 1
                    idx = '$i%d' % self.depth
                    self.out.append('{(%s || []).map((%s, %s) => (<React.Fragment key={%s}>' % (lst, a['as'], idx, idx))
                    self.scopes.append((a['as'], idx)); stack.append(tag)
                continue
            if tag == 'sc-if':
                if close:
                    stack.pop(); self.out.append('</>) : null}')
                else:
                    a = {k: (v or '')[1:-1] for k, v in ATTR.findall(raw)}
                    self.out.append('{(%s) ? (<>' % (self.value(a['value']) or json.dumps(a['value'])))
                    stack.append(tag)
                continue
            if close:
                if tag in VOID:
                    continue
                stack.pop()
                if tag == 'pre' or (self.pre and tag == 'pre'):
                    self.pre -= 1
                self.out.append('</%s>' % tag)
                continue
            if tag == 'option':
                # React: the chosen option is the <select>'s value, not `selected` on the option
                raw = re.sub(r'\s+selected(\s*=\s*("[^"]*"|\'[^\']*\'))?', '', raw)
            at = self.attrs(raw, tag)
            if tag == 'select':
                inner = src[m.end():src.find('</select>', m.end())]
                loop = re.search(r'<sc-for\s+list="\{\{\s*([^}]+?)\s*\}\}"\s+as="([^"]+)"', inner)
                opt = re.search(r'<option\s+value="\{\{\s*([^}]+?)\s*\}\}"\s+selected="\{\{\s*([^}]+?)\s*\}\}"', inner)
                if loop and opt:
                    item = loop.group(2)
                    lst = self.expr(loop.group(1))
                    at += ' value={((%s) || []).find((%s) => %s)?.%s ?? ""}' % (lst, item, opt.group(2), opt.group(1).split('.', 1)[1])
            if tag in VOID or selfclose:
                self.out.append('<%s%s />' % (tag, (' ' + at) if at else ''))
            else:
                if tag == 'pre':
                    self.pre += 1
                stack.append(tag)
                self.out.append('<%s%s>' % (tag, (' ' + at) if at else ''))
        assert not stack, 'unclosed: %s' % stack
        return ''.join(self.out)


def main(src_path, out_path, name):
    src = open(src_path, encoding='utf-8').read()
    body = src.split('</helmet>', 1)[1].split('</x-dc>', 1)[0]
    jsx = Conv().run(body)
    script = re.search(r'<script type="text/x-dc" data-dc-script[^>]*>(.*?)</script>', src, re.S).group(1)
    head, cls = script.split('class Component extends DCLogic {', 1)
    cls = cls.rstrip()
    assert cls.endswith('}')
    cls = cls[:-1].rstrip()
    out = (
        "// Generated from the design canvas \"Data Masking Redesign\" (%s) by dc2jsx.py.\n"
        "// Markup and logic are the design's own; edit the design or this file, not both.\n"
        "import React from 'react';\n"
        "import { css, route } from '../lib/dc.js';\n\n"
        "%s\n"
        "class Design extends React.Component {%s\n\n"
        "  render() {\n"
        "    const V = this.renderVals();\n"
        "    return (%s);\n"
        "  }\n"
        "}\n\n"
        "// `initial` overrides the design's starting state (the canvas shows each screen in a different state).\n"
        "export default class %s extends Design {\n"
        "  constructor(props) {\n"
        "    super(props);\n"
        "    if (props.initial) this.state = { ...this.state, ...props.initial };\n"
        "  }\n"
        "}\n"
    ) % (src_path.replace('\\', '/').split('/')[-1], head.strip(), cls, jsx, name)
    open(out_path, 'w', encoding='utf-8', newline='\n').write(out)
    print('wrote', out_path, len(out), 'chars')


if __name__ == '__main__':
    main(*sys.argv[1:4])
