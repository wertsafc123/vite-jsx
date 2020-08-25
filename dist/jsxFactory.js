import { withDirectives, vShow, vModelText, vModelDynamic, vModelCheckbox, vModelSelect, vModelRadio, isVNode } from 'vue';
export function factory(node) {
    const { props, children } = node;
    if (children instanceof Array) {
        let vIfChain = [];
        children.forEach((item, index) => {
            if (isVNode(item) && item.props) {
                const hasVIf = Reflect.has(item.props, 'v-if');
                const hasVElseIf = Reflect.has(item.props, 'v-else-if');
                const hasVElse = Reflect.has(item.props, 'v-else');
                let type;
                if ([hasVIf, hasVElseIf, hasVElse].filter(item => item).length > 1) {
                    throw new Error('\'v-if\',\'v-else-if\',\'v-else\'. Don\'t use them together');
                }
                if (hasVIf)
                    vIfChain = [], vIfChain.push(item.props['v-if']), type = 1;
                else if (hasVElseIf)
                    vIfChain.push(item.props['v-else-if']), type = 2;
                else if (hasVElse)
                    vIfChain.push(true), type = 3;
                else
                    vIfChain = [];
                if (type)
                    children[index] = transformVif(item, index, vIfChain, type);
            }
            else {
                vIfChain = [];
            }
        });
    }
    if (!props)
        return node;
    const directives = [];
    const dynamicProps = [];
    if (Reflect.has(props, 'v-show')) {
        const val = props['v-show'];
        Reflect.deleteProperty(props, 'v-show');
        directives.push([vShow, val]);
    }
    if (Reflect.has(props, 'v-html')) {
        const val = props['v-html'];
        props['innerHTML'] = val;
        dynamicProps.push('innerHTML');
        Reflect.deleteProperty(props, 'v-html');
    }
    if (Reflect.has(props, 'v-text')) {
        const val = props['v-text'];
        props['textContent'] = val;
        dynamicProps.push('textContent');
        Reflect.deleteProperty(props, 'v-text');
    }
    if (Reflect.has(props, 'style')) {
        node.patchFlag = 4;
    }
    if (Reflect.has(props, 'class')) {
        node.patchFlag = 2;
    }
    Reflect.ownKeys(props).map(item => {
        if (typeof item === 'string') {
            if (item.match(/^v-model[^]*/)) {
                directives.push(transformVmodel(node, item));
            }
        }
    });
    if (dynamicProps.length) {
        node.dynamicProps = dynamicProps;
        if (node.patchFlag) {
            node.patchFlag = 16;
        }
        else {
            node.patchFlag = 8;
        }
    }
    return directives.length ? withDirectives(node, directives) : node;
}
function transformVmodel(node, kind) {
    const { props } = node;
    const val = props[kind];
    Reflect.deleteProperty(props, kind);
    let directive;
    switch (node.type) {
        case 'input':
            directive = vModelText;
            break;
        case 'textarea':
            directive = vModelText;
            break;
        case 'checkbox':
            directive = vModelCheckbox;
            break;
        case 'select':
            directive = vModelSelect;
            break;
        case 'radio':
            directive = vModelRadio;
            break;
        default:
            directive = vModelDynamic;
            break;
    }
    const result = kind.split('_');
    let modifiers;
    if (result.length > 1)
        modifiers = result.slice(1);
    const obj = {};
    modifiers && modifiers.map(item => obj[item] = true);
    return modifiers ? [directive, val, '', obj] : [directive, val];
}
function transformVif(node, index, vIfChain, type) {
    const { props } = node;
    if (type === 1) {
        const val = props['v-if'];
        Reflect.deleteProperty(props, 'v-if');
        if (!val)
            return null;
    }
    if (type === 2) {
        const val = props['v-else-if'];
        Reflect.deleteProperty(props, 'v-else-if');
        if (index === 0) {
            throw new Error('Make sure the element which bind \'v-else-if\' dircetive is not the first element.');
        }
        else {
            if (vIfChain.length === 1) {
                throw new Error('Please keep \'v-if\',\'v-else-if\',\'v-else\' together forever');
            }
            if (vIfChain.some((item, index) => item && index !== vIfChain.length - 1)) {
                return null;
            }
            else {
                if (!val)
                    return null;
            }
        }
    }
    if (type === 3) {
        Reflect.deleteProperty(props, 'v-else');
        if (index === 0) {
            throw new Error('Make sure the element which bind \'v-else\' dircetive is not the first element.');
        }
        else {
            if (vIfChain.length === 1) {
                throw new Error('Please keep \'v-if\',\'v-else-if\',\'v-else\' together forever');
            }
            if (vIfChain.some((item, index) => item && index !== vIfChain.length - 1)) {
                return null;
            }
        }
    }
    return node;
}
