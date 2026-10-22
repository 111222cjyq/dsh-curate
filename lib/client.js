// dsh-curate - browser half.
//
// A header entry opens a full-screen workbench for one Session. The workbench
// reads the current surface from the host, slices it into turn-sized cards,
// lets the human triage each card (important / normal / minor) and rewrite any
// message, then compresses the selected windows: the host asks the model for
// each replacement summary at compression time. Apply replaces the selected
// windows in place; the host backs up and validates first.
//
// The module is a classic client bundle (client-modules protocol): it registers
// a factory with window.__ModuleLoader__ and returns apply().
window.__ModuleLoader__.load({
  id: 'dsh-curate',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })

    const react = require('react')
    const jsxRuntime = require('react/jsx-runtime')
    const { jsx, jsxs } = jsxRuntime

    var __DSHCURATE_VENDOR__=(()=>{var Bt=Object.defineProperty;var Ci=Object.getOwnPropertyDescriptor;var Ii=Object.getOwnPropertyNames;var Di=Object.prototype.hasOwnProperty;var Pi=(t,e)=>{for(var n in e)Bt(t,n,{get:e[n],enumerable:!0})},Mi=(t,e,n,r)=>{if(e&&typeof e=="object"||typeof e=="function")for(let i of Ii(e))!Di.call(t,i)&&i!==n&&Bt(t,i,{get:()=>e[i],enumerable:!(r=Ci(e,i))||r.enumerable});return t};var zi=t=>Mi(Bt({},"__esModule",{value:!0}),t);var Oo={};Pi(Oo,{DOMPurify:()=>Qr,marked:()=>w,turndown:()=>Jr});function Gt(){return{async:!1,breaks:!1,extensions:null,gfm:!0,hooks:null,pedantic:!1,renderer:null,silent:!1,tokenizer:null,walkTokens:null}}var ke=Gt();function ir(t){ke=t}var Fe={exec:()=>null};function _(t,e=""){let n=typeof t=="string"?t:t.source,r={replace:(i,o)=>{let l=typeof o=="string"?o:o.source;return l=l.replace(B.caret,"$1"),n=n.replace(i,l),r},getRegex:()=>new RegExp(n,e)};return r}var B={codeRemoveIndent:/^(?: {1,4}| {0,3}\t)/gm,outputLinkReplace:/\\([\[\]])/g,indentCodeCompensation:/^(\s+)(?:```)/,beginningSpace:/^\s+/,endingHash:/#$/,startingSpaceChar:/^ /,endingSpaceChar:/ $/,nonSpaceChar:/[^ ]/,newLineCharGlobal:/\n/g,tabCharGlobal:/\t/g,multipleSpaceGlobal:/\s+/g,blankLine:/^[ \t]*$/,doubleBlankLine:/\n[ \t]*\n[ \t]*$/,blockquoteStart:/^ {0,3}>/,blockquoteSetextReplace:/\n {0,3}((?:=+|-+) *)(?=\n|$)/g,blockquoteSetextReplace2:/^ {0,3}>[ \t]?/gm,listReplaceTabs:/^\t+/,listReplaceNesting:/^ {1,4}(?=( {4})*[^ ])/g,listIsTask:/^\[[ xX]\] /,listReplaceTask:/^\[[ xX]\] +/,anyLine:/\n.*\n/,hrefBrackets:/^<(.*)>$/,tableDelimiter:/[:|]/,tableAlignChars:/^\||\| *$/g,tableRowBlankLine:/\n[ \t]*$/,tableAlignRight:/^ *-+: *$/,tableAlignCenter:/^ *:-+: *$/,tableAlignLeft:/^ *:-+ *$/,startATag:/^<a /i,endATag:/^<\/a>/i,startPreScriptTag:/^<(pre|code|kbd|script)(\s|>)/i,endPreScriptTag:/^<\/(pre|code|kbd|script)(\s|>)/i,startAngleBracket:/^</,endAngleBracket:/>$/,pedanticHrefTitle:/^([^'"]*[^\s])\s+(['"])(.*)\2/,unicodeAlphaNumeric:/[\p{L}\p{N}]/u,escapeTest:/[&<>"']/,escapeReplace:/[&<>"']/g,escapeTestNoEncode:/[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,escapeReplaceNoEncode:/[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,unescapeTest:/&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig,caret:/(^|[^\[])\^/g,percentDecode:/%25/g,findPipe:/\|/g,splitPipe:/ \|/,slashPipe:/\\\|/g,carriageReturn:/\r\n|\r/g,spaceLine:/^ +$/gm,notSpaceStart:/^\S*/,endingNewline:/\n$/,listItemRegex:t=>new RegExp(`^( {0,3}${t})((?:[	 ][^\\n]*)?(?:\\n|$))`),nextBulletRegex:t=>new RegExp(`^ {0,${Math.min(3,t-1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`),hrRegex:t=>new RegExp(`^ {0,${Math.min(3,t-1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`),fencesBeginRegex:t=>new RegExp(`^ {0,${Math.min(3,t-1)}}(?:\`\`\`|~~~)`),headingBeginRegex:t=>new RegExp(`^ {0,${Math.min(3,t-1)}}#`),htmlBeginRegex:t=>new RegExp(`^ {0,${Math.min(3,t-1)}}<(?:[a-z].*>|!--)`,"i")},$i=/^(?:[ \t]*(?:\n|$))+/,Bi=/^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/,Ui=/^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/,He=/^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/,Fi=/^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/,Wt=/(?:[*+-]|\d{1,9}[.)])/,sr=/^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/,or=_(sr).replace(/bull/g,Wt).replace(/blockCode/g,/(?: {4}| {0,3}\t)/).replace(/fences/g,/ {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g,/ {0,3}>/).replace(/heading/g,/ {0,3}#{1,6}/).replace(/html/g,/ {0,3}<[^\n>]+>\n/).replace(/\|table/g,"").getRegex(),Hi=_(sr).replace(/bull/g,Wt).replace(/blockCode/g,/(?: {4}| {0,3}\t)/).replace(/fences/g,/ {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g,/ {0,3}>/).replace(/heading/g,/ {0,3}#{1,6}/).replace(/html/g,/ {0,3}<[^\n>]+>\n/).replace(/table/g,/ {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex(),jt=/^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/,Gi=/^[^\n]+/,qt=/(?!\s*\])(?:\\.|[^\[\]\\])+/,Wi=_(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label",qt).replace("title",/(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(),ji=_(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g,Wt).getRegex(),ct="address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul",Yt=/<!--(?:-?>|[\s\S]*?(?:-->|$))/,qi=_("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))","i").replace("comment",Yt).replace("tag",ct).replace("attribute",/ +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(),ar=_(jt).replace("hr",He).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("|lheading","").replace("|table","").replace("blockquote"," {0,3}>").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list"," {0,3}(?:[*+-]|1[.)]) ").replace("html","</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag",ct).getRegex(),Yi=_(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph",ar).getRegex(),Vt={blockquote:Yi,code:Bi,def:Wi,fences:Ui,heading:Fi,hr:He,html:qi,lheading:or,list:ji,newline:$i,paragraph:ar,table:Fe,text:Gi},Jn=_("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr",He).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("blockquote"," {0,3}>").replace("code","(?: {4}| {0,3}	)[^\\n]").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list"," {0,3}(?:[*+-]|1[.)]) ").replace("html","</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag",ct).getRegex(),Vi={...Vt,lheading:Hi,table:Jn,paragraph:_(jt).replace("hr",He).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("|lheading","").replace("table",Jn).replace("blockquote"," {0,3}>").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list"," {0,3}(?:[*+-]|1[.)]) ").replace("html","</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag",ct).getRegex()},Zi={...Vt,html:_(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment",Yt).replace(/tag/g,"(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),def:/^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,heading:/^(#{1,6})(.*)(?:\n+|$)/,fences:Fe,lheading:/^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,paragraph:_(jt).replace("hr",He).replace("heading",` *#{1,6} *[^
]`).replace("lheading",or).replace("|table","").replace("blockquote"," {0,3}>").replace("|fences","").replace("|list","").replace("|html","").replace("|tag","").getRegex()},Xi=/^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,Ki=/^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,lr=/^( {2,}|\\)\n(?!\s*$)/,Qi=/^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/,ut=/[\p{P}\p{S}]/u,Zt=/[\s\p{P}\p{S}]/u,cr=/[^\s\p{P}\p{S}]/u,Ji=_(/^((?![*_])punctSpace)/,"u").replace(/punctSpace/g,Zt).getRegex(),ur=/(?!~)[\p{P}\p{S}]/u,es=/(?!~)[\s\p{P}\p{S}]/u,ts=/(?:[^\s\p{P}\p{S}]|~)/u,ns=/\[[^[\]]*?\]\((?:\\.|[^\\\(\)]|\((?:\\.|[^\\\(\)])*\))*\)|`[^`]*?`|<[^<>]*?>/g,fr=/^(?:\*+(?:((?!\*)punct)|[^\s*]))|^_+(?:((?!_)punct)|([^\s_]))/,rs=_(fr,"u").replace(/punct/g,ut).getRegex(),is=_(fr,"u").replace(/punct/g,ur).getRegex(),pr="^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)",ss=_(pr,"gu").replace(/notPunctSpace/g,cr).replace(/punctSpace/g,Zt).replace(/punct/g,ut).getRegex(),os=_(pr,"gu").replace(/notPunctSpace/g,ts).replace(/punctSpace/g,es).replace(/punct/g,ur).getRegex(),as=_("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)","gu").replace(/notPunctSpace/g,cr).replace(/punctSpace/g,Zt).replace(/punct/g,ut).getRegex(),ls=_(/\\(punct)/,"gu").replace(/punct/g,ut).getRegex(),cs=_(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme",/[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email",/[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(),us=_(Yt).replace("(?:-->|$)","-->").getRegex(),fs=_("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment",us).replace("attribute",/\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(),ot=/(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/,ps=_(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]*(?:\n[ \t]*)?)(title))?\s*\)/).replace("label",ot).replace("href",/<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title",/"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(),hr=_(/^!?\[(label)\]\[(ref)\]/).replace("label",ot).replace("ref",qt).getRegex(),dr=_(/^!?\[(ref)\](?:\[\])?/).replace("ref",qt).getRegex(),hs=_("reflink|nolink(?!\\()","g").replace("reflink",hr).replace("nolink",dr).getRegex(),Xt={_backpedal:Fe,anyPunctuation:ls,autolink:cs,blockSkip:ns,br:lr,code:Ki,del:Fe,emStrongLDelim:rs,emStrongRDelimAst:ss,emStrongRDelimUnd:as,escape:Xi,link:ps,nolink:dr,punctuation:Ji,reflink:hr,reflinkSearch:hs,tag:fs,text:Qi,url:Fe},ds={...Xt,link:_(/^!?\[(label)\]\((.*?)\)/).replace("label",ot).getRegex(),reflink:_(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label",ot).getRegex()},Ut={...Xt,emStrongRDelimAst:os,emStrongLDelim:is,url:_(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/,"i").replace("email",/[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),_backpedal:/(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,del:/^(~~?)(?=[^\s~])((?:\\.|[^\\])*?(?:\\.|[^\s~\\]))\1(?=[^~]|$)/,text:/^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/},gs={...Ut,br:_(lr).replace("{2,}","*").getRegex(),text:_(Ut.text).replace("\\b_","\\b_| {2,}\\n").replace(/\{2,\}/g,"*").getRegex()},it={normal:Vt,gfm:Vi,pedantic:Zi},Be={normal:Xt,gfm:Ut,breaks:gs,pedantic:ds},ms={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"},er=t=>ms[t];function J(t,e){if(e){if(B.escapeTest.test(t))return t.replace(B.escapeReplace,er)}else if(B.escapeTestNoEncode.test(t))return t.replace(B.escapeReplaceNoEncode,er);return t}function tr(t){try{t=encodeURI(t).replace(B.percentDecode,"%")}catch{return null}return t}function nr(t,e){let n=t.replace(B.findPipe,(o,l,c)=>{let p=!1,d=l;for(;--d>=0&&c[d]==="\\";)p=!p;return p?"|":" |"}),r=n.split(B.splitPipe),i=0;if(r[0].trim()||r.shift(),r.length>0&&!r.at(-1)?.trim()&&r.pop(),e)if(r.length>e)r.splice(e);else for(;r.length<e;)r.push("");for(;i<r.length;i++)r[i]=r[i].trim().replace(B.slashPipe,"|");return r}function Ue(t,e,n){let r=t.length;if(r===0)return"";let i=0;for(;i<r;){let o=t.charAt(r-i-1);if(o===e&&!n)i++;else if(o!==e&&n)i++;else break}return t.slice(0,r-i)}function bs(t,e){if(t.indexOf(e[1])===-1)return-1;let n=0;for(let r=0;r<t.length;r++)if(t[r]==="\\")r++;else if(t[r]===e[0])n++;else if(t[r]===e[1]&&(n--,n<0))return r;return n>0?-2:-1}function rr(t,e,n,r,i){let o=e.href,l=e.title||null,c=t[1].replace(i.other.outputLinkReplace,"$1");r.state.inLink=!0;let p={type:t[0].charAt(0)==="!"?"image":"link",raw:n,href:o,title:l,text:c,tokens:r.inlineTokens(c)};return r.state.inLink=!1,p}function ks(t,e,n){let r=t.match(n.other.indentCodeCompensation);if(r===null)return e;let i=r[1];return e.split(`
`).map(o=>{let l=o.match(n.other.beginningSpace);if(l===null)return o;let[c]=l;return c.length>=i.length?o.slice(i.length):o}).join(`
`)}var at=class{options;rules;lexer;constructor(t){this.options=t||ke}space(t){let e=this.rules.block.newline.exec(t);if(e&&e[0].length>0)return{type:"space",raw:e[0]}}code(t){let e=this.rules.block.code.exec(t);if(e){let n=e[0].replace(this.rules.other.codeRemoveIndent,"");return{type:"code",raw:e[0],codeBlockStyle:"indented",text:this.options.pedantic?n:Ue(n,`
`)}}}fences(t){let e=this.rules.block.fences.exec(t);if(e){let n=e[0],r=ks(n,e[3]||"",this.rules);return{type:"code",raw:n,lang:e[2]?e[2].trim().replace(this.rules.inline.anyPunctuation,"$1"):e[2],text:r}}}heading(t){let e=this.rules.block.heading.exec(t);if(e){let n=e[2].trim();if(this.rules.other.endingHash.test(n)){let r=Ue(n,"#");(this.options.pedantic||!r||this.rules.other.endingSpaceChar.test(r))&&(n=r.trim())}return{type:"heading",raw:e[0],depth:e[1].length,text:n,tokens:this.lexer.inline(n)}}}hr(t){let e=this.rules.block.hr.exec(t);if(e)return{type:"hr",raw:Ue(e[0],`
`)}}blockquote(t){let e=this.rules.block.blockquote.exec(t);if(e){let n=Ue(e[0],`
`).split(`
`),r="",i="",o=[];for(;n.length>0;){let l=!1,c=[],p;for(p=0;p<n.length;p++)if(this.rules.other.blockquoteStart.test(n[p]))c.push(n[p]),l=!0;else if(!l)c.push(n[p]);else break;n=n.slice(p);let d=c.join(`
`),g=d.replace(this.rules.other.blockquoteSetextReplace,`
    $1`).replace(this.rules.other.blockquoteSetextReplace2,"");r=r?`${r}
${d}`:d,i=i?`${i}
${g}`:g;let k=this.lexer.state.top;if(this.lexer.state.top=!0,this.lexer.blockTokens(g,o,!0),this.lexer.state.top=k,n.length===0)break;let x=o.at(-1);if(x?.type==="code")break;if(x?.type==="blockquote"){let N=x,A=N.raw+`
`+n.join(`
`),U=this.blockquote(A);o[o.length-1]=U,r=r.substring(0,r.length-N.raw.length)+U.raw,i=i.substring(0,i.length-N.text.length)+U.text;break}else if(x?.type==="list"){let N=x,A=N.raw+`
`+n.join(`
`),U=this.list(A);o[o.length-1]=U,r=r.substring(0,r.length-x.raw.length)+U.raw,i=i.substring(0,i.length-N.raw.length)+U.raw,n=A.substring(o.at(-1).raw.length).split(`
`);continue}}return{type:"blockquote",raw:r,tokens:o,text:i}}}list(t){let e=this.rules.block.list.exec(t);if(e){let n=e[1].trim(),r=n.length>1,i={type:"list",raw:"",ordered:r,start:r?+n.slice(0,-1):"",loose:!1,items:[]};n=r?`\\d{1,9}\\${n.slice(-1)}`:`\\${n}`,this.options.pedantic&&(n=r?n:"[*+-]");let o=this.rules.other.listItemRegex(n),l=!1;for(;t;){let p=!1,d="",g="";if(!(e=o.exec(t))||this.rules.block.hr.test(t))break;d=e[0],t=t.substring(d.length);let k=e[2].split(`
`,1)[0].replace(this.rules.other.listReplaceTabs,V=>" ".repeat(3*V.length)),x=t.split(`
`,1)[0],N=!k.trim(),A=0;if(this.options.pedantic?(A=2,g=k.trimStart()):N?A=e[1].length+1:(A=e[2].search(this.rules.other.nonSpaceChar),A=A>4?1:A,g=k.slice(A),A+=e[1].length),N&&this.rules.other.blankLine.test(x)&&(d+=x+`
`,t=t.substring(x.length+1),p=!0),!p){let V=this.rules.other.nextBulletRegex(A),ye=this.rules.other.hrRegex(A),xe=this.rules.other.fencesBeginRegex(A),Z=this.rules.other.headingBeginRegex(A),oe=this.rules.other.htmlBeginRegex(A);for(;t;){let ae=t.split(`
`,1)[0],I;if(x=ae,this.options.pedantic?(x=x.replace(this.rules.other.listReplaceNesting,"  "),I=x):I=x.replace(this.rules.other.tabCharGlobal,"    "),xe.test(x)||Z.test(x)||oe.test(x)||V.test(x)||ye.test(x))break;if(I.search(this.rules.other.nonSpaceChar)>=A||!x.trim())g+=`
`+I.slice(A);else{if(N||k.replace(this.rules.other.tabCharGlobal,"    ").search(this.rules.other.nonSpaceChar)>=4||xe.test(k)||Z.test(k)||ye.test(k))break;g+=`
`+x}!N&&!x.trim()&&(N=!0),d+=ae+`
`,t=t.substring(ae.length+1),k=I.slice(A)}}i.loose||(l?i.loose=!0:this.rules.other.doubleBlankLine.test(d)&&(l=!0));let U=null,se;this.options.gfm&&(U=this.rules.other.listIsTask.exec(g),U&&(se=U[0]!=="[ ] ",g=g.replace(this.rules.other.listReplaceTask,""))),i.items.push({type:"list_item",raw:d,task:!!U,checked:se,loose:!1,text:g,tokens:[]}),i.raw+=d}let c=i.items.at(-1);if(c)c.raw=c.raw.trimEnd(),c.text=c.text.trimEnd();else return;i.raw=i.raw.trimEnd();for(let p=0;p<i.items.length;p++)if(this.lexer.state.top=!1,i.items[p].tokens=this.lexer.blockTokens(i.items[p].text,[]),!i.loose){let d=i.items[p].tokens.filter(k=>k.type==="space"),g=d.length>0&&d.some(k=>this.rules.other.anyLine.test(k.raw));i.loose=g}if(i.loose)for(let p=0;p<i.items.length;p++)i.items[p].loose=!0;return i}}html(t){let e=this.rules.block.html.exec(t);if(e)return{type:"html",block:!0,raw:e[0],pre:e[1]==="pre"||e[1]==="script"||e[1]==="style",text:e[0]}}def(t){let e=this.rules.block.def.exec(t);if(e){let n=e[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal," "),r=e[2]?e[2].replace(this.rules.other.hrefBrackets,"$1").replace(this.rules.inline.anyPunctuation,"$1"):"",i=e[3]?e[3].substring(1,e[3].length-1).replace(this.rules.inline.anyPunctuation,"$1"):e[3];return{type:"def",tag:n,raw:e[0],href:r,title:i}}}table(t){let e=this.rules.block.table.exec(t);if(!e||!this.rules.other.tableDelimiter.test(e[2]))return;let n=nr(e[1]),r=e[2].replace(this.rules.other.tableAlignChars,"").split("|"),i=e[3]?.trim()?e[3].replace(this.rules.other.tableRowBlankLine,"").split(`
`):[],o={type:"table",raw:e[0],header:[],align:[],rows:[]};if(n.length===r.length){for(let l of r)this.rules.other.tableAlignRight.test(l)?o.align.push("right"):this.rules.other.tableAlignCenter.test(l)?o.align.push("center"):this.rules.other.tableAlignLeft.test(l)?o.align.push("left"):o.align.push(null);for(let l=0;l<n.length;l++)o.header.push({text:n[l],tokens:this.lexer.inline(n[l]),header:!0,align:o.align[l]});for(let l of i)o.rows.push(nr(l,o.header.length).map((c,p)=>({text:c,tokens:this.lexer.inline(c),header:!1,align:o.align[p]})));return o}}lheading(t){let e=this.rules.block.lheading.exec(t);if(e)return{type:"heading",raw:e[0],depth:e[2].charAt(0)==="="?1:2,text:e[1],tokens:this.lexer.inline(e[1])}}paragraph(t){let e=this.rules.block.paragraph.exec(t);if(e){let n=e[1].charAt(e[1].length-1)===`
`?e[1].slice(0,-1):e[1];return{type:"paragraph",raw:e[0],text:n,tokens:this.lexer.inline(n)}}}text(t){let e=this.rules.block.text.exec(t);if(e)return{type:"text",raw:e[0],text:e[0],tokens:this.lexer.inline(e[0])}}escape(t){let e=this.rules.inline.escape.exec(t);if(e)return{type:"escape",raw:e[0],text:e[1]}}tag(t){let e=this.rules.inline.tag.exec(t);if(e)return!this.lexer.state.inLink&&this.rules.other.startATag.test(e[0])?this.lexer.state.inLink=!0:this.lexer.state.inLink&&this.rules.other.endATag.test(e[0])&&(this.lexer.state.inLink=!1),!this.lexer.state.inRawBlock&&this.rules.other.startPreScriptTag.test(e[0])?this.lexer.state.inRawBlock=!0:this.lexer.state.inRawBlock&&this.rules.other.endPreScriptTag.test(e[0])&&(this.lexer.state.inRawBlock=!1),{type:"html",raw:e[0],inLink:this.lexer.state.inLink,inRawBlock:this.lexer.state.inRawBlock,block:!1,text:e[0]}}link(t){let e=this.rules.inline.link.exec(t);if(e){let n=e[2].trim();if(!this.options.pedantic&&this.rules.other.startAngleBracket.test(n)){if(!this.rules.other.endAngleBracket.test(n))return;let o=Ue(n.slice(0,-1),"\\");if((n.length-o.length)%2===0)return}else{let o=bs(e[2],"()");if(o===-2)return;if(o>-1){let c=(e[0].indexOf("!")===0?5:4)+e[1].length+o;e[2]=e[2].substring(0,o),e[0]=e[0].substring(0,c).trim(),e[3]=""}}let r=e[2],i="";if(this.options.pedantic){let o=this.rules.other.pedanticHrefTitle.exec(r);o&&(r=o[1],i=o[3])}else i=e[3]?e[3].slice(1,-1):"";return r=r.trim(),this.rules.other.startAngleBracket.test(r)&&(this.options.pedantic&&!this.rules.other.endAngleBracket.test(n)?r=r.slice(1):r=r.slice(1,-1)),rr(e,{href:r&&r.replace(this.rules.inline.anyPunctuation,"$1"),title:i&&i.replace(this.rules.inline.anyPunctuation,"$1")},e[0],this.lexer,this.rules)}}reflink(t,e){let n;if((n=this.rules.inline.reflink.exec(t))||(n=this.rules.inline.nolink.exec(t))){let r=(n[2]||n[1]).replace(this.rules.other.multipleSpaceGlobal," "),i=e[r.toLowerCase()];if(!i){let o=n[0].charAt(0);return{type:"text",raw:o,text:o}}return rr(n,i,n[0],this.lexer,this.rules)}}emStrong(t,e,n=""){let r=this.rules.inline.emStrongLDelim.exec(t);if(!r||r[3]&&n.match(this.rules.other.unicodeAlphaNumeric))return;if(!(r[1]||r[2]||"")||!n||this.rules.inline.punctuation.exec(n)){let o=[...r[0]].length-1,l,c,p=o,d=0,g=r[0][0]==="*"?this.rules.inline.emStrongRDelimAst:this.rules.inline.emStrongRDelimUnd;for(g.lastIndex=0,e=e.slice(-1*t.length+o);(r=g.exec(e))!=null;){if(l=r[1]||r[2]||r[3]||r[4]||r[5]||r[6],!l)continue;if(c=[...l].length,r[3]||r[4]){p+=c;continue}else if((r[5]||r[6])&&o%3&&!((o+c)%3)){d+=c;continue}if(p-=c,p>0)continue;c=Math.min(c,c+p+d);let k=[...r[0]][0].length,x=t.slice(0,o+r.index+k+c);if(Math.min(o,c)%2){let A=x.slice(1,-1);return{type:"em",raw:x,text:A,tokens:this.lexer.inlineTokens(A)}}let N=x.slice(2,-2);return{type:"strong",raw:x,text:N,tokens:this.lexer.inlineTokens(N)}}}}codespan(t){let e=this.rules.inline.code.exec(t);if(e){let n=e[2].replace(this.rules.other.newLineCharGlobal," "),r=this.rules.other.nonSpaceChar.test(n),i=this.rules.other.startingSpaceChar.test(n)&&this.rules.other.endingSpaceChar.test(n);return r&&i&&(n=n.substring(1,n.length-1)),{type:"codespan",raw:e[0],text:n}}}br(t){let e=this.rules.inline.br.exec(t);if(e)return{type:"br",raw:e[0]}}del(t){let e=this.rules.inline.del.exec(t);if(e)return{type:"del",raw:e[0],text:e[2],tokens:this.lexer.inlineTokens(e[2])}}autolink(t){let e=this.rules.inline.autolink.exec(t);if(e){let n,r;return e[2]==="@"?(n=e[1],r="mailto:"+n):(n=e[1],r=n),{type:"link",raw:e[0],text:n,href:r,tokens:[{type:"text",raw:n,text:n}]}}}url(t){let e;if(e=this.rules.inline.url.exec(t)){let n,r;if(e[2]==="@")n=e[0],r="mailto:"+n;else{let i;do i=e[0],e[0]=this.rules.inline._backpedal.exec(e[0])?.[0]??"";while(i!==e[0]);n=e[0],e[1]==="www."?r="http://"+e[0]:r=e[0]}return{type:"link",raw:e[0],text:n,href:r,tokens:[{type:"text",raw:n,text:n}]}}}inlineText(t){let e=this.rules.inline.text.exec(t);if(e){let n=this.lexer.state.inRawBlock;return{type:"text",raw:e[0],text:e[0],escaped:n}}}},te=class Ft{tokens;options;state;tokenizer;inlineQueue;constructor(e){this.tokens=[],this.tokens.links=Object.create(null),this.options=e||ke,this.options.tokenizer=this.options.tokenizer||new at,this.tokenizer=this.options.tokenizer,this.tokenizer.options=this.options,this.tokenizer.lexer=this,this.inlineQueue=[],this.state={inLink:!1,inRawBlock:!1,top:!0};let n={other:B,block:it.normal,inline:Be.normal};this.options.pedantic?(n.block=it.pedantic,n.inline=Be.pedantic):this.options.gfm&&(n.block=it.gfm,this.options.breaks?n.inline=Be.breaks:n.inline=Be.gfm),this.tokenizer.rules=n}static get rules(){return{block:it,inline:Be}}static lex(e,n){return new Ft(n).lex(e)}static lexInline(e,n){return new Ft(n).inlineTokens(e)}lex(e){e=e.replace(B.carriageReturn,`
`),this.blockTokens(e,this.tokens);for(let n=0;n<this.inlineQueue.length;n++){let r=this.inlineQueue[n];this.inlineTokens(r.src,r.tokens)}return this.inlineQueue=[],this.tokens}blockTokens(e,n=[],r=!1){for(this.options.pedantic&&(e=e.replace(B.tabCharGlobal,"    ").replace(B.spaceLine,""));e;){let i;if(this.options.extensions?.block?.some(l=>(i=l.call({lexer:this},e,n))?(e=e.substring(i.raw.length),n.push(i),!0):!1))continue;if(i=this.tokenizer.space(e)){e=e.substring(i.raw.length);let l=n.at(-1);i.raw.length===1&&l!==void 0?l.raw+=`
`:n.push(i);continue}if(i=this.tokenizer.code(e)){e=e.substring(i.raw.length);let l=n.at(-1);l?.type==="paragraph"||l?.type==="text"?(l.raw+=`
`+i.raw,l.text+=`
`+i.text,this.inlineQueue.at(-1).src=l.text):n.push(i);continue}if(i=this.tokenizer.fences(e)){e=e.substring(i.raw.length),n.push(i);continue}if(i=this.tokenizer.heading(e)){e=e.substring(i.raw.length),n.push(i);continue}if(i=this.tokenizer.hr(e)){e=e.substring(i.raw.length),n.push(i);continue}if(i=this.tokenizer.blockquote(e)){e=e.substring(i.raw.length),n.push(i);continue}if(i=this.tokenizer.list(e)){e=e.substring(i.raw.length),n.push(i);continue}if(i=this.tokenizer.html(e)){e=e.substring(i.raw.length),n.push(i);continue}if(i=this.tokenizer.def(e)){e=e.substring(i.raw.length);let l=n.at(-1);l?.type==="paragraph"||l?.type==="text"?(l.raw+=`
`+i.raw,l.text+=`
`+i.raw,this.inlineQueue.at(-1).src=l.text):this.tokens.links[i.tag]||(this.tokens.links[i.tag]={href:i.href,title:i.title});continue}if(i=this.tokenizer.table(e)){e=e.substring(i.raw.length),n.push(i);continue}if(i=this.tokenizer.lheading(e)){e=e.substring(i.raw.length),n.push(i);continue}let o=e;if(this.options.extensions?.startBlock){let l=1/0,c=e.slice(1),p;this.options.extensions.startBlock.forEach(d=>{p=d.call({lexer:this},c),typeof p=="number"&&p>=0&&(l=Math.min(l,p))}),l<1/0&&l>=0&&(o=e.substring(0,l+1))}if(this.state.top&&(i=this.tokenizer.paragraph(o))){let l=n.at(-1);r&&l?.type==="paragraph"?(l.raw+=`
`+i.raw,l.text+=`
`+i.text,this.inlineQueue.pop(),this.inlineQueue.at(-1).src=l.text):n.push(i),r=o.length!==e.length,e=e.substring(i.raw.length);continue}if(i=this.tokenizer.text(e)){e=e.substring(i.raw.length);let l=n.at(-1);l?.type==="text"?(l.raw+=`
`+i.raw,l.text+=`
`+i.text,this.inlineQueue.pop(),this.inlineQueue.at(-1).src=l.text):n.push(i);continue}if(e){let l="Infinite loop on byte: "+e.charCodeAt(0);if(this.options.silent){console.error(l);break}else throw new Error(l)}}return this.state.top=!0,n}inline(e,n=[]){return this.inlineQueue.push({src:e,tokens:n}),n}inlineTokens(e,n=[]){let r=e,i=null;if(this.tokens.links){let c=Object.keys(this.tokens.links);if(c.length>0)for(;(i=this.tokenizer.rules.inline.reflinkSearch.exec(r))!=null;)c.includes(i[0].slice(i[0].lastIndexOf("[")+1,-1))&&(r=r.slice(0,i.index)+"["+"a".repeat(i[0].length-2)+"]"+r.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex))}for(;(i=this.tokenizer.rules.inline.anyPunctuation.exec(r))!=null;)r=r.slice(0,i.index)+"++"+r.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);for(;(i=this.tokenizer.rules.inline.blockSkip.exec(r))!=null;)r=r.slice(0,i.index)+"["+"a".repeat(i[0].length-2)+"]"+r.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);let o=!1,l="";for(;e;){o||(l=""),o=!1;let c;if(this.options.extensions?.inline?.some(d=>(c=d.call({lexer:this},e,n))?(e=e.substring(c.raw.length),n.push(c),!0):!1))continue;if(c=this.tokenizer.escape(e)){e=e.substring(c.raw.length),n.push(c);continue}if(c=this.tokenizer.tag(e)){e=e.substring(c.raw.length),n.push(c);continue}if(c=this.tokenizer.link(e)){e=e.substring(c.raw.length),n.push(c);continue}if(c=this.tokenizer.reflink(e,this.tokens.links)){e=e.substring(c.raw.length);let d=n.at(-1);c.type==="text"&&d?.type==="text"?(d.raw+=c.raw,d.text+=c.text):n.push(c);continue}if(c=this.tokenizer.emStrong(e,r,l)){e=e.substring(c.raw.length),n.push(c);continue}if(c=this.tokenizer.codespan(e)){e=e.substring(c.raw.length),n.push(c);continue}if(c=this.tokenizer.br(e)){e=e.substring(c.raw.length),n.push(c);continue}if(c=this.tokenizer.del(e)){e=e.substring(c.raw.length),n.push(c);continue}if(c=this.tokenizer.autolink(e)){e=e.substring(c.raw.length),n.push(c);continue}if(!this.state.inLink&&(c=this.tokenizer.url(e))){e=e.substring(c.raw.length),n.push(c);continue}let p=e;if(this.options.extensions?.startInline){let d=1/0,g=e.slice(1),k;this.options.extensions.startInline.forEach(x=>{k=x.call({lexer:this},g),typeof k=="number"&&k>=0&&(d=Math.min(d,k))}),d<1/0&&d>=0&&(p=e.substring(0,d+1))}if(c=this.tokenizer.inlineText(p)){e=e.substring(c.raw.length),c.raw.slice(-1)!=="_"&&(l=c.raw.slice(-1)),o=!0;let d=n.at(-1);d?.type==="text"?(d.raw+=c.raw,d.text+=c.text):n.push(c);continue}if(e){let d="Infinite loop on byte: "+e.charCodeAt(0);if(this.options.silent){console.error(d);break}else throw new Error(d)}}return n}},lt=class{options;parser;constructor(t){this.options=t||ke}space(t){return""}code({text:t,lang:e,escaped:n}){let r=(e||"").match(B.notSpaceStart)?.[0],i=t.replace(B.endingNewline,"")+`
`;return r?'<pre><code class="language-'+J(r)+'">'+(n?i:J(i,!0))+`</code></pre>
`:"<pre><code>"+(n?i:J(i,!0))+`</code></pre>
`}blockquote({tokens:t}){return`<blockquote>
${this.parser.parse(t)}</blockquote>
`}html({text:t}){return t}heading({tokens:t,depth:e}){return`<h${e}>${this.parser.parseInline(t)}</h${e}>
`}hr(t){return`<hr>
`}list(t){let e=t.ordered,n=t.start,r="";for(let l=0;l<t.items.length;l++){let c=t.items[l];r+=this.listitem(c)}let i=e?"ol":"ul",o=e&&n!==1?' start="'+n+'"':"";return"<"+i+o+`>
`+r+"</"+i+`>
`}listitem(t){let e="";if(t.task){let n=this.checkbox({checked:!!t.checked});t.loose?t.tokens[0]?.type==="paragraph"?(t.tokens[0].text=n+" "+t.tokens[0].text,t.tokens[0].tokens&&t.tokens[0].tokens.length>0&&t.tokens[0].tokens[0].type==="text"&&(t.tokens[0].tokens[0].text=n+" "+J(t.tokens[0].tokens[0].text),t.tokens[0].tokens[0].escaped=!0)):t.tokens.unshift({type:"text",raw:n+" ",text:n+" ",escaped:!0}):e+=n+" "}return e+=this.parser.parse(t.tokens,!!t.loose),`<li>${e}</li>
`}checkbox({checked:t}){return"<input "+(t?'checked="" ':"")+'disabled="" type="checkbox">'}paragraph({tokens:t}){return`<p>${this.parser.parseInline(t)}</p>
`}table(t){let e="",n="";for(let i=0;i<t.header.length;i++)n+=this.tablecell(t.header[i]);e+=this.tablerow({text:n});let r="";for(let i=0;i<t.rows.length;i++){let o=t.rows[i];n="";for(let l=0;l<o.length;l++)n+=this.tablecell(o[l]);r+=this.tablerow({text:n})}return r&&(r=`<tbody>${r}</tbody>`),`<table>
<thead>
`+e+`</thead>
`+r+`</table>
`}tablerow({text:t}){return`<tr>
${t}</tr>
`}tablecell(t){let e=this.parser.parseInline(t.tokens),n=t.header?"th":"td";return(t.align?`<${n} align="${t.align}">`:`<${n}>`)+e+`</${n}>
`}strong({tokens:t}){return`<strong>${this.parser.parseInline(t)}</strong>`}em({tokens:t}){return`<em>${this.parser.parseInline(t)}</em>`}codespan({text:t}){return`<code>${J(t,!0)}</code>`}br(t){return"<br>"}del({tokens:t}){return`<del>${this.parser.parseInline(t)}</del>`}link({href:t,title:e,tokens:n}){let r=this.parser.parseInline(n),i=tr(t);if(i===null)return r;t=i;let o='<a href="'+t+'"';return e&&(o+=' title="'+J(e)+'"'),o+=">"+r+"</a>",o}image({href:t,title:e,text:n,tokens:r}){r&&(n=this.parser.parseInline(r,this.parser.textRenderer));let i=tr(t);if(i===null)return J(n);t=i;let o=`<img src="${t}" alt="${n}"`;return e&&(o+=` title="${J(e)}"`),o+=">",o}text(t){return"tokens"in t&&t.tokens?this.parser.parseInline(t.tokens):"escaped"in t&&t.escaped?t.text:J(t.text)}},Kt=class{strong({text:t}){return t}em({text:t}){return t}codespan({text:t}){return t}del({text:t}){return t}html({text:t}){return t}text({text:t}){return t}link({text:t}){return""+t}image({text:t}){return""+t}br(){return""}},ne=class Ht{options;renderer;textRenderer;constructor(e){this.options=e||ke,this.options.renderer=this.options.renderer||new lt,this.renderer=this.options.renderer,this.renderer.options=this.options,this.renderer.parser=this,this.textRenderer=new Kt}static parse(e,n){return new Ht(n).parse(e)}static parseInline(e,n){return new Ht(n).parseInline(e)}parse(e,n=!0){let r="";for(let i=0;i<e.length;i++){let o=e[i];if(this.options.extensions?.renderers?.[o.type]){let c=o,p=this.options.extensions.renderers[c.type].call({parser:this},c);if(p!==!1||!["space","hr","heading","code","table","blockquote","list","html","paragraph","text"].includes(c.type)){r+=p||"";continue}}let l=o;switch(l.type){case"space":{r+=this.renderer.space(l);continue}case"hr":{r+=this.renderer.hr(l);continue}case"heading":{r+=this.renderer.heading(l);continue}case"code":{r+=this.renderer.code(l);continue}case"table":{r+=this.renderer.table(l);continue}case"blockquote":{r+=this.renderer.blockquote(l);continue}case"list":{r+=this.renderer.list(l);continue}case"html":{r+=this.renderer.html(l);continue}case"paragraph":{r+=this.renderer.paragraph(l);continue}case"text":{let c=l,p=this.renderer.text(c);for(;i+1<e.length&&e[i+1].type==="text";)c=e[++i],p+=`
`+this.renderer.text(c);n?r+=this.renderer.paragraph({type:"paragraph",raw:p,text:p,tokens:[{type:"text",raw:p,text:p,escaped:!0}]}):r+=p;continue}default:{let c='Token with "'+l.type+'" type was not found.';if(this.options.silent)return console.error(c),"";throw new Error(c)}}}return r}parseInline(e,n=this.renderer){let r="";for(let i=0;i<e.length;i++){let o=e[i];if(this.options.extensions?.renderers?.[o.type]){let c=this.options.extensions.renderers[o.type].call({parser:this},o);if(c!==!1||!["escape","html","link","image","strong","em","codespan","br","del","text"].includes(o.type)){r+=c||"";continue}}let l=o;switch(l.type){case"escape":{r+=n.text(l);break}case"html":{r+=n.html(l);break}case"link":{r+=n.link(l);break}case"image":{r+=n.image(l);break}case"strong":{r+=n.strong(l);break}case"em":{r+=n.em(l);break}case"codespan":{r+=n.codespan(l);break}case"br":{r+=n.br(l);break}case"del":{r+=n.del(l);break}case"text":{r+=n.text(l);break}default:{let c='Token with "'+l.type+'" type was not found.';if(this.options.silent)return console.error(c),"";throw new Error(c)}}}return r}},st=class{options;block;constructor(t){this.options=t||ke}static passThroughHooks=new Set(["preprocess","postprocess","processAllTokens"]);preprocess(t){return t}postprocess(t){return t}processAllTokens(t){return t}provideLexer(){return this.block?te.lex:te.lexInline}provideParser(){return this.block?ne.parse:ne.parseInline}},Ts=class{defaults=Gt();options=this.setOptions;parse=this.parseMarkdown(!0);parseInline=this.parseMarkdown(!1);Parser=ne;Renderer=lt;TextRenderer=Kt;Lexer=te;Tokenizer=at;Hooks=st;constructor(...t){this.use(...t)}walkTokens(t,e){let n=[];for(let r of t)switch(n=n.concat(e.call(this,r)),r.type){case"table":{let i=r;for(let o of i.header)n=n.concat(this.walkTokens(o.tokens,e));for(let o of i.rows)for(let l of o)n=n.concat(this.walkTokens(l.tokens,e));break}case"list":{let i=r;n=n.concat(this.walkTokens(i.items,e));break}default:{let i=r;this.defaults.extensions?.childTokens?.[i.type]?this.defaults.extensions.childTokens[i.type].forEach(o=>{let l=i[o].flat(1/0);n=n.concat(this.walkTokens(l,e))}):i.tokens&&(n=n.concat(this.walkTokens(i.tokens,e)))}}return n}use(...t){let e=this.defaults.extensions||{renderers:{},childTokens:{}};return t.forEach(n=>{let r={...n};if(r.async=this.defaults.async||r.async||!1,n.extensions&&(n.extensions.forEach(i=>{if(!i.name)throw new Error("extension name required");if("renderer"in i){let o=e.renderers[i.name];o?e.renderers[i.name]=function(...l){let c=i.renderer.apply(this,l);return c===!1&&(c=o.apply(this,l)),c}:e.renderers[i.name]=i.renderer}if("tokenizer"in i){if(!i.level||i.level!=="block"&&i.level!=="inline")throw new Error("extension level must be 'block' or 'inline'");let o=e[i.level];o?o.unshift(i.tokenizer):e[i.level]=[i.tokenizer],i.start&&(i.level==="block"?e.startBlock?e.startBlock.push(i.start):e.startBlock=[i.start]:i.level==="inline"&&(e.startInline?e.startInline.push(i.start):e.startInline=[i.start]))}"childTokens"in i&&i.childTokens&&(e.childTokens[i.name]=i.childTokens)}),r.extensions=e),n.renderer){let i=this.defaults.renderer||new lt(this.defaults);for(let o in n.renderer){if(!(o in i))throw new Error(`renderer '${o}' does not exist`);if(["options","parser"].includes(o))continue;let l=o,c=n.renderer[l],p=i[l];i[l]=(...d)=>{let g=c.apply(i,d);return g===!1&&(g=p.apply(i,d)),g||""}}r.renderer=i}if(n.tokenizer){let i=this.defaults.tokenizer||new at(this.defaults);for(let o in n.tokenizer){if(!(o in i))throw new Error(`tokenizer '${o}' does not exist`);if(["options","rules","lexer"].includes(o))continue;let l=o,c=n.tokenizer[l],p=i[l];i[l]=(...d)=>{let g=c.apply(i,d);return g===!1&&(g=p.apply(i,d)),g}}r.tokenizer=i}if(n.hooks){let i=this.defaults.hooks||new st;for(let o in n.hooks){if(!(o in i))throw new Error(`hook '${o}' does not exist`);if(["options","block"].includes(o))continue;let l=o,c=n.hooks[l],p=i[l];st.passThroughHooks.has(o)?i[l]=d=>{if(this.defaults.async)return Promise.resolve(c.call(i,d)).then(k=>p.call(i,k));let g=c.call(i,d);return p.call(i,g)}:i[l]=(...d)=>{let g=c.apply(i,d);return g===!1&&(g=p.apply(i,d)),g}}r.hooks=i}if(n.walkTokens){let i=this.defaults.walkTokens,o=n.walkTokens;r.walkTokens=function(l){let c=[];return c.push(o.call(this,l)),i&&(c=c.concat(i.call(this,l))),c}}this.defaults={...this.defaults,...r}}),this}setOptions(t){return this.defaults={...this.defaults,...t},this}lexer(t,e){return te.lex(t,e??this.defaults)}parser(t,e){return ne.parse(t,e??this.defaults)}parseMarkdown(t){return(n,r)=>{let i={...r},o={...this.defaults,...i},l=this.onError(!!o.silent,!!o.async);if(this.defaults.async===!0&&i.async===!1)return l(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));if(typeof n>"u"||n===null)return l(new Error("marked(): input parameter is undefined or null"));if(typeof n!="string")return l(new Error("marked(): input parameter is of type "+Object.prototype.toString.call(n)+", string expected"));o.hooks&&(o.hooks.options=o,o.hooks.block=t);let c=o.hooks?o.hooks.provideLexer():t?te.lex:te.lexInline,p=o.hooks?o.hooks.provideParser():t?ne.parse:ne.parseInline;if(o.async)return Promise.resolve(o.hooks?o.hooks.preprocess(n):n).then(d=>c(d,o)).then(d=>o.hooks?o.hooks.processAllTokens(d):d).then(d=>o.walkTokens?Promise.all(this.walkTokens(d,o.walkTokens)).then(()=>d):d).then(d=>p(d,o)).then(d=>o.hooks?o.hooks.postprocess(d):d).catch(l);try{o.hooks&&(n=o.hooks.preprocess(n));let d=c(n,o);o.hooks&&(d=o.hooks.processAllTokens(d)),o.walkTokens&&this.walkTokens(d,o.walkTokens);let g=p(d,o);return o.hooks&&(g=o.hooks.postprocess(g)),g}catch(d){return l(d)}}}onError(t,e){return n=>{if(n.message+=`
Please report this to https://github.com/markedjs/marked.`,t){let r="<p>An error occurred:</p><pre>"+J(n.message+"",!0)+"</pre>";return e?Promise.resolve(r):r}if(e)return Promise.reject(n);throw n}}},be=new Ts;function w(t,e){return be.parse(t,e)}w.options=w.setOptions=function(t){return be.setOptions(t),w.defaults=be.defaults,ir(w.defaults),w};w.getDefaults=Gt;w.defaults=ke;w.use=function(...t){return be.use(...t),w.defaults=be.defaults,ir(w.defaults),w};w.walkTokens=function(t,e){return be.walkTokens(t,e)};w.parseInline=be.parseInline;w.Parser=ne;w.parser=ne.parse;w.Renderer=lt;w.TextRenderer=Kt;w.Lexer=te;w.lexer=te.lex;w.Tokenizer=at;w.Hooks=st;w.parse=w;var No=w.options,Co=w.setOptions,Io=w.use,Do=w.walkTokens,Po=w.parseInline;var Mo=ne.parse,zo=te.lex;function ys(t){for(var e=1;e<arguments.length;e++){var n=arguments[e];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(t[r]=n[r])}return t}function tn(t,e){return Array(e+1).join(t)}function br(t){return t.replace(/^\n*/,"")}function kr(t){for(var e=t.length;e>0&&t[e-1]===`
`;)e--;return t.substring(0,e)}function Tr(t){return kr(br(t))}var xs=["ADDRESS","ARTICLE","ASIDE","AUDIO","BLOCKQUOTE","BODY","CANVAS","CENTER","DD","DIR","DIV","DL","DT","FIELDSET","FIGCAPTION","FIGURE","FOOTER","FORM","FRAMESET","H1","H2","H3","H4","H5","H6","HEADER","HGROUP","HR","HTML","ISINDEX","LI","MAIN","MENU","NAV","NOFRAMES","NOSCRIPT","OL","OUTPUT","P","PRE","SECTION","TABLE","TBODY","TD","TFOOT","TH","THEAD","TR","UL"];function nn(t){return rn(t,xs)}var yr=["AREA","BASE","BR","COL","COMMAND","EMBED","HR","IMG","INPUT","KEYGEN","LINK","META","PARAM","SOURCE","TRACK","WBR"];function xr(t){return rn(t,yr)}function ws(t){return _r(t,yr)}var wr=["A","TABLE","THEAD","TBODY","TFOOT","TH","TD","IFRAME","SCRIPT","AUDIO","VIDEO"];function _s(t){return rn(t,wr)}function As(t){return _r(t,wr)}function rn(t,e){return e.indexOf(t.nodeName)>=0}function _r(t,e){return t.getElementsByTagName&&e.some(function(n){return t.getElementsByTagName(n).length})}var Ss=[[/\\/g,"\\\\"],[/\*/g,"\\*"],[/^-/g,"\\-"],[/^\+ /g,"\\+ "],[/^(=+)/g,"\\$1"],[/^(#{1,6}) /g,"\\$1 "],[/`/g,"\\`"],[/^~~~/g,"\\~~~"],[/\[/g,"\\["],[/\]/g,"\\]"],[/^>/g,"\\>"],[/_/g,"\\_"],[/^(\d+)\. /g,"$1\\. "]];function Ar(t){return Ss.reduce(function(e,n){return e.replace(n[0],n[1])},t)}var z={};z.paragraph={filter:"p",replacement:function(t){return`

`+t+`

`}};z.lineBreak={filter:"br",replacement:function(t,e,n){return n.br+`
`}};z.heading={filter:["h1","h2","h3","h4","h5","h6"],replacement:function(t,e,n){var r=Number(e.nodeName.charAt(1));if(n.headingStyle==="setext"&&r<3){var i=tn(r===1?"=":"-",t.length);return`

`+t+`
`+i+`

`}else return`

`+tn("#",r)+" "+t+`

`}};z.blockquote={filter:"blockquote",replacement:function(t){return t=Tr(t).replace(/^/gm,"> "),`

`+t+`

`}};z.list={filter:["ul","ol"],replacement:function(t,e){var n=e.parentNode;return n.nodeName==="LI"&&n.lastElementChild===e?`
`+t:`

`+t+`

`}};z.listItem={filter:"li",replacement:function(t,e,n){var r=n.bulletListMarker+"   ",i=e.parentNode;if(i.nodeName==="OL"){var o=i.getAttribute("start"),l=Array.prototype.indexOf.call(i.children,e);r=(o?Number(o)+l:l+1)+".  "}var c=/\n$/.test(t);return t=Tr(t)+(c?`
`:""),t=t.replace(/\n/gm,`
`+" ".repeat(r.length)),r+t+(e.nextSibling?`
`:"")}};z.indentedCodeBlock={filter:function(t,e){return e.codeBlockStyle==="indented"&&t.nodeName==="PRE"&&t.firstChild&&t.firstChild.nodeName==="CODE"},replacement:function(t,e,n){return`

    `+e.firstChild.textContent.replace(/\n/g,`
    `)+`

`}};z.fencedCodeBlock={filter:function(t,e){return e.codeBlockStyle==="fenced"&&t.nodeName==="PRE"&&t.firstChild&&t.firstChild.nodeName==="CODE"},replacement:function(t,e,n){for(var r=e.firstChild.getAttribute("class")||"",i=(r.match(/language-(\S+)/)||[null,""])[1],o=e.firstChild.textContent,l=n.fence.charAt(0),c=3,p=new RegExp("^"+l+"{3,}","gm"),d;d=p.exec(o);)d[0].length>=c&&(c=d[0].length+1);var g=tn(l,c);return`

`+g+i+`
`+o.replace(/\n$/,"")+`
`+g+`

`}};z.horizontalRule={filter:"hr",replacement:function(t,e,n){return`

`+n.hr+`

`}};z.inlineLink={filter:function(t,e){return e.linkStyle==="inlined"&&t.nodeName==="A"&&t.getAttribute("href")},replacement:function(t,e){var n=sn(e.getAttribute("href")),r=on(ft(e.getAttribute("title"))),i=r?' "'+r+'"':"";return"["+t+"]("+n+i+")"}};z.referenceLink={filter:function(t,e){return e.linkStyle==="referenced"&&t.nodeName==="A"&&t.getAttribute("href")},replacement:function(t,e,n){var r=sn(e.getAttribute("href")),i=ft(e.getAttribute("title"));i&&(i=' "'+on(i)+'"');var o,l;switch(n.linkReferenceStyle){case"collapsed":o="["+t+"][]",l="["+t+"]: "+r+i;break;case"shortcut":o="["+t+"]",l="["+t+"]: "+r+i;break;default:var c=this.references.length+1;o="["+t+"]["+c+"]",l="["+c+"]: "+r+i}return this.references.push(l),o},references:[],append:function(t){var e="";return this.references.length&&(e=`

`+this.references.join(`
`)+`

`,this.references=[]),e}};z.emphasis={filter:["em","i"],replacement:function(t,e,n){return t.trim()?n.emDelimiter+t+n.emDelimiter:""}};z.strong={filter:["strong","b"],replacement:function(t,e,n){return t.trim()?n.strongDelimiter+t+n.strongDelimiter:""}};z.code={filter:function(t){var e=t.previousSibling||t.nextSibling,n=t.parentNode.nodeName==="PRE"&&!e;return t.nodeName==="CODE"&&!n},replacement:function(t){if(!t)return"";t=t.replace(/\r?\n|\r/g," ");for(var e=/^`|^ .*?[^ ].* $|`$/.test(t)?" ":"",n="`",r=t.match(/`+/gm)||[];r.indexOf(n)!==-1;)n=n+"`";return n+e+t+e+n}};z.image={filter:"img",replacement:function(t,e){var n=Ar(ft(e.getAttribute("alt"))),r=sn(e.getAttribute("src")||""),i=ft(e.getAttribute("title")),o=i?' "'+on(i)+'"':"";return r?"!["+n+"]("+r+o+")":""}};function ft(t){return t?t.replace(/(\n+\s*)+/g,`
`):""}function sn(t){var e=t.replace(/([<>()])/g,"\\$1");return e.indexOf(" ")>=0?"<"+e+">":e}function on(t){return t.replace(/"/g,'\\"')}function Sr(t){this.options=t,this._keep=[],this._remove=[],this.blankRule={replacement:t.blankReplacement},this.keepReplacement=t.keepReplacement,this.defaultRule={replacement:t.defaultReplacement},this.array=[];for(var e in t.rules)this.array.push(t.rules[e])}Sr.prototype={add:function(t,e){this.array.unshift(e)},keep:function(t){this._keep.unshift({filter:t,replacement:this.keepReplacement})},remove:function(t){this._remove.unshift({filter:t,replacement:function(){return""}})},forNode:function(t){if(t.isBlank)return this.blankRule;var e;return(e=Qt(this.array,t,this.options))||(e=Qt(this._keep,t,this.options))||(e=Qt(this._remove,t,this.options))?e:this.defaultRule},forEach:function(t){for(var e=0;e<this.array.length;e++)t(this.array[e],e)}};function Qt(t,e,n){for(var r=0;r<t.length;r++){var i=t[r];if(Es(i,e,n))return i}}function Es(t,e,n){var r=t.filter;if(typeof r=="string"){if(r===e.nodeName.toLowerCase())return!0}else if(Array.isArray(r)){if(r.indexOf(e.nodeName.toLowerCase())>-1)return!0}else if(typeof r=="function"){if(r.call(t,e,n))return!0}else throw new TypeError("`filter` needs to be a string, array, or function")}function vs(t){var e=t.element,n=t.isBlock,r=t.isVoid,i=t.isPre||function(k){return k.nodeName==="PRE"};if(!(!e.firstChild||i(e))){for(var o=null,l=!1,c=null,p=gr(c,e,i);p!==e;){if(p.nodeType===3||p.nodeType===4){var d=p.data.replace(/[ \r\n\t]+/g," ");if((!o||/ $/.test(o.data))&&!l&&d[0]===" "&&(d=d.substr(1)),!d){p=Jt(p);continue}p.data=d,o=p}else if(p.nodeType===1)n(p)||p.nodeName==="BR"?(o&&(o.data=o.data.replace(/ $/,"")),o=null,l=!1):r(p)||i(p)?(o=null,l=!0):o&&(l=!1);else{p=Jt(p);continue}var g=gr(c,p,i);c=p,p=g}o&&(o.data=o.data.replace(/ $/,""),o.data||Jt(o))}}function Jt(t){var e=t.nextSibling||t.parentNode;return t.parentNode.removeChild(t),e}function gr(t,e,n){return t&&t.parentNode===e||n(e)?e.nextSibling||e.parentNode:e.firstChild||e.nextSibling||e.parentNode}var an=typeof window<"u"?window:{};function Rs(){var t=an.DOMParser,e=!1;try{new t().parseFromString("","text/html")&&(e=!0)}catch{}return e}function Os(){var t=function(){};return Ls()?t.prototype.parseFromString=function(e){var n=new window.ActiveXObject("htmlfile");return n.designMode="on",n.open(),n.write(e),n.close(),n}:t.prototype.parseFromString=function(e){var n=document.implementation.createHTMLDocument("");return n.open(),n.write(e),n.close(),n},t}function Ls(){var t=!1;try{document.implementation.createHTMLDocument("").open()}catch{an.ActiveXObject&&(t=!0)}return t}var Ns=Rs()?an.DOMParser:Os();function Cs(t,e){var n;if(typeof t=="string"){var r=Is().parseFromString('<x-turndown id="turndown-root">'+t+"</x-turndown>","text/html");n=r.getElementById("turndown-root")}else n=t.cloneNode(!0);return vs({element:n,isBlock:nn,isVoid:xr,isPre:e.preformattedCode?Ds:null}),n}var en;function Is(){return en=en||new Ns,en}function Ds(t){return t.nodeName==="PRE"||t.nodeName==="CODE"}function Ps(t,e){return t.isBlock=nn(t),t.isCode=t.nodeName==="CODE"||t.parentNode.isCode,t.isBlank=Ms(t),t.flankingWhitespace=zs(t,e),t}function Ms(t){return!xr(t)&&!_s(t)&&/^\s*$/i.test(t.textContent)&&!ws(t)&&!As(t)}function zs(t,e){if(t.isBlock||e.preformattedCode&&t.isCode)return{leading:"",trailing:""};var n=$s(t.textContent);return n.leadingAscii&&mr("left",t,e)&&(n.leading=n.leadingNonAscii),n.trailingAscii&&mr("right",t,e)&&(n.trailing=n.trailingNonAscii),{leading:n.leading,trailing:n.trailing}}function $s(t){var e=t.match(/^(([ \t\r\n]*)(\s*))(?:(?=\S)[\s\S]*\S)?((\s*?)([ \t\r\n]*))$/);return{leading:e[1],leadingAscii:e[2],leadingNonAscii:e[3],trailing:e[4],trailingNonAscii:e[5],trailingAscii:e[6]}}function mr(t,e,n){var r,i,o;return t==="left"?(r=e.previousSibling,i=/ $/):(r=e.nextSibling,i=/^ /),r&&(r.nodeType===3?o=i.test(r.nodeValue):n.preformattedCode&&r.nodeName==="CODE"?o=!1:r.nodeType===1&&!nn(r)&&(o=i.test(r.textContent))),o}var Bs=Array.prototype.reduce;function Ge(t){if(!(this instanceof Ge))return new Ge(t);var e={rules:z,headingStyle:"setext",hr:"* * *",bulletListMarker:"*",codeBlockStyle:"indented",fence:"```",emDelimiter:"_",strongDelimiter:"**",linkStyle:"inlined",linkReferenceStyle:"full",br:"  ",preformattedCode:!1,blankReplacement:function(n,r){return r.isBlock?`

`:""},keepReplacement:function(n,r){return r.isBlock?`

`+r.outerHTML+`

`:r.outerHTML},defaultReplacement:function(n,r){return r.isBlock?`

`+n+`

`:n}};this.options=ys({},e,t),this.rules=new Sr(this.options)}Ge.prototype={turndown:function(t){if(!Hs(t))throw new TypeError(t+" is not a string, or an element/document/fragment node.");if(t==="")return"";var e=Er.call(this,new Cs(t,this.options));return Us.call(this,e)},use:function(t){if(Array.isArray(t))for(var e=0;e<t.length;e++)this.use(t[e]);else if(typeof t=="function")t(this);else throw new TypeError("plugin must be a Function or an Array of Functions");return this},addRule:function(t,e){return this.rules.add(t,e),this},keep:function(t){return this.rules.keep(t),this},remove:function(t){return this.rules.remove(t),this},escape:function(t){return Ar(t)}};function Er(t){var e=this;return Bs.call(t.childNodes,function(n,r){r=new Ps(r,e.options);var i="";return r.nodeType===3?i=r.isCode?r.nodeValue:e.escape(r.nodeValue):r.nodeType===1&&(i=Fs.call(e,r)),vr(n,i)},"")}function Us(t){var e=this;return this.rules.forEach(function(n){typeof n.append=="function"&&(t=vr(t,n.append(e.options)))}),t.replace(/^[\t\r\n]+/,"").replace(/[\t\r\n\s]+$/,"")}function Fs(t){var e=this.rules.forNode(t),n=Er.call(this,t),r=t.flankingWhitespace;return(r.leading||r.trailing)&&(n=n.trim()),r.leading+e.replacement(n,t,this.options)+r.trailing}function vr(t,e){var n=kr(t),r=br(e),i=Math.max(t.length-n.length,e.length-r.length),o=`

`.substring(0,i);return n+o+r}function Hs(t){return t!=null&&(typeof t=="string"||t.nodeType&&(t.nodeType===1||t.nodeType===9||t.nodeType===11))}var Rr=/highlight-(?:text|source)-([a-z0-9]+)/;function Gs(t){t.addRule("highlightedCodeBlock",{filter:function(e){var n=e.firstChild;return e.nodeName==="DIV"&&Rr.test(e.className)&&n&&n.nodeName==="PRE"},replacement:function(e,n,r){var i=n.className||"",o=(i.match(Rr)||[null,""])[1];return`

`+r.fence+o+`
`+n.firstChild.textContent+`
`+r.fence+`

`}})}function Ws(t){t.addRule("strikethrough",{filter:["del","s","strike"],replacement:function(e){return"~"+e+"~"}})}var js=Array.prototype.indexOf,qs=Array.prototype.every,Le={};Le.tableCell={filter:["th","td"],replacement:function(t,e){return Or(t,e)}};Le.tableRow={filter:"tr",replacement:function(t,e){var n="",r={left:":--",right:"--:",center:":-:"};if(ln(e))for(var i=0;i<e.childNodes.length;i++){var o="---",l=(e.childNodes[i].getAttribute("align")||"").toLowerCase();l&&(o=r[l]||o),n+=Or(o,e.childNodes[i])}return`
`+t+(n?`
`+n:"")}};Le.table={filter:function(t){return t.nodeName==="TABLE"&&ln(t.rows[0])},replacement:function(t){return t=t.replace(`

`,`
`),`

`+t+`

`}};Le.tableSection={filter:["thead","tbody","tfoot"],replacement:function(t){return t}};function ln(t){var e=t.parentNode;return e.nodeName==="THEAD"||e.firstChild===t&&(e.nodeName==="TABLE"||Ys(e))&&qs.call(t.childNodes,function(n){return n.nodeName==="TH"})}function Ys(t){var e=t.previousSibling;return t.nodeName==="TBODY"&&(!e||e.nodeName==="THEAD"&&/^\s*$/i.test(e.textContent))}function Or(t,e){var n=js.call(e.parentNode.childNodes,e),r=" ";return n===0&&(r="| "),r+t+" |"}function Vs(t){t.keep(function(n){return n.nodeName==="TABLE"&&!ln(n.rows[0])});for(var e in Le)t.addRule(e,Le[e])}function Zs(t){t.addRule("taskListItems",{filter:function(e){return e.type==="checkbox"&&e.parentNode.nodeName==="LI"},replacement:function(e,n){return(n.checked?"[x]":"[ ]")+" "}})}function Lr(t){t.use([Gs,Ws,Vs,Zs])}function Xs(t,e){this.v=t,this.k=e}function Nr(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,r=Array(e);n<e;n++)r[n]=t[n];return r}function Ks(t){if(Array.isArray(t))return t}function Qs(t,e){var n=t==null?null:typeof Symbol<"u"&&t[Symbol.iterator]||t["@@iterator"];if(n!=null){var r,i,o,l,c=[],p=!0,d=!1;try{if(o=(n=n.call(t)).next,e===0){if(Object(n)!==n)return;p=!1}else for(;!(p=(r=o.call(n)).done)&&(c.push(r.value),c.length!==e);p=!0);}catch(g){d=!0,i=g}finally{try{if(!p&&n.return!=null&&(l=n.return(),Object(l)!==l))return}finally{if(d)throw i}}return c}}function Js(){throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function eo(t,e){return Ks(t)||Qs(t,e)||to(t,e)||Js()}function to(t,e){if(t){if(typeof t=="string")return Nr(t,e);var n={}.toString.call(t).slice(8,-1);return n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set"?Array.from(t):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?Nr(t,e):void 0}}function pt(t){var e,n;function r(o,l){try{var c=t[o](l),p=c.value,d=p instanceof Xs;Promise.resolve(d?p.v:p).then(function(g){if(d){var k=o==="return"&&p.k?o:"next";if(!p.k||g.done)return r(k,g);g=t[k](g).value}i(!!c.done,g)},function(g){r("throw",g)})}catch(g){i(2,g)}}function i(o,l){o===2?e.reject(l):e.resolve({value:l,done:o}),(e=e.next)?r(e.key,e.arg):n=null}this._invoke=function(o,l){return new Promise(function(c,p){var d={key:o,arg:l,resolve:c,reject:p,next:null};n?n=n.next=d:(e=n=d,r(o,l))})},typeof t.return!="function"&&(this.return=void 0)}pt.prototype[typeof Symbol=="function"&&Symbol.asyncIterator||"@@asyncIterator"]=function(){return this},pt.prototype.next=function(t){return this._invoke("next",t)},pt.prototype.throw=function(t){return this._invoke("throw",t)},pt.prototype.return=function(t){return this._invoke("return",t)};var qr=Object.entries,Cr=Object.setPrototypeOf,no=Object.isFrozen,Yr=Object.getPrototypeOf,Vr=Object.getOwnPropertyDescriptor,D=Object.freeze,M=Object.seal,Ne=Object.create,Zr=typeof Reflect<"u"&&Reflect,kn=Zr.apply,Tn=Zr.construct;D||(D=function(e){return e});M||(M=function(e){return e});kn||(kn=function(e,n){for(var r=arguments.length,i=new Array(r>2?r-2:0),o=2;o<r;o++)i[o-2]=arguments[o];return e.apply(n,i)});Tn||(Tn=function(e){for(var n=arguments.length,r=new Array(n>1?n-1:0),i=1;i<n;i++)r[i-1]=arguments[i];return new e(...r)});var re=R(Array.prototype.forEach);Array.prototype.indexOf;var ro=R(Array.prototype.lastIndexOf),Ir=R(Array.prototype.pop),We=R(Array.prototype.push),io=R(Array.prototype.slice),so=R(Array.prototype.splice),Ce=Array.isArray,cn=Xr(Set),un=R(Set.prototype.add),je=R(Set.prototype.has),Te=R(String.prototype.toLowerCase),fn=R(String.prototype.toString),Dr=R(String.prototype.match),qe=R(String.prototype.replace),Pr=R(String.prototype.indexOf),oo=R(String.prototype.trim),ao=R(Number.prototype.toString),lo=R(Boolean.prototype.toString),Mr=typeof BigInt>"u"?null:R(BigInt.prototype.toString),zr=typeof Symbol>"u"?null:R(Symbol.prototype.toString),W=R(Object.prototype.hasOwnProperty),Ye=R(Object.prototype.toString),P=R(RegExp.prototype.test),ie=Xr(TypeError);function R(t){return function(e){e instanceof RegExp&&(e.lastIndex=0);for(var n=arguments.length,r=new Array(n>1?n-1:0),i=1;i<n;i++)r[i-1]=arguments[i];return kn(t,e,r)}}function Xr(t){return function(){for(var e=arguments.length,n=new Array(e),r=0;r<e;r++)n[r]=arguments[r];return Tn(t,n)}}function y(t,e){let n=arguments.length>2&&arguments[2]!==void 0?arguments[2]:Te;if(Cr&&Cr(t,null),!Ce(e))return t;let r=e.length;for(;r--;){let i=e[r];if(typeof i=="string"){let o=n(i);o!==i&&(no(e)||(e[r]=o),i=o)}t[i]=!0}return t}function co(t){for(let e=0;e<t.length;e++)W(t,e)||(t[e]=null);return t}function j(t){let e=Ne(null);for(let r of qr(t)){var n=eo(r,2);let i=n[0],o=n[1];W(t,i)&&(Ce(o)?e[i]=co(o):o&&typeof o=="object"&&o.constructor===Object?e[i]=j(o):e[i]=o)}return e}function uo(t){switch(typeof t){case"string":return t;case"number":return ao(t);case"boolean":return lo(t);case"bigint":return Mr?Mr(t):"0";case"symbol":return zr?zr(t):"Symbol()";case"undefined":return Ye(t);case"function":case"object":{if(t===null)return Ye(t);let e=t,n=q(e,"toString");if(typeof n=="function"){let r=n(e);return typeof r=="string"?r:Ye(r)}return Ye(t)}default:return Ye(t)}}function q(t,e){for(;t!==null;){let r=Vr(t,e);if(r){if(r.get)return R(r.get);if(typeof r.value=="function")return R(r.value)}t=Yr(t)}function n(){return null}return n}function fo(t,e){for(;t!==null;){let n=Vr(t,e);if(n)return n.get?R(n.get):null;t=Yr(t)}return null}function po(t){try{return P(t,""),!0}catch{return!1}}var $r=D(["a","abbr","acronym","address","area","article","aside","audio","b","bdi","bdo","big","blink","blockquote","body","br","button","canvas","caption","center","cite","code","col","colgroup","content","data","datalist","dd","decorator","del","details","dfn","dialog","dir","div","dl","dt","element","em","fieldset","figcaption","figure","font","footer","form","h1","h2","h3","h4","h5","h6","head","header","hgroup","hr","html","i","img","input","ins","kbd","label","legend","li","main","map","mark","marquee","menu","menuitem","meter","nav","nobr","ol","optgroup","option","output","p","picture","pre","progress","q","rp","rt","ruby","s","samp","search","section","select","shadow","slot","small","source","spacer","span","strike","strong","style","sub","summary","sup","table","tbody","td","template","textarea","tfoot","th","thead","time","tr","track","tt","u","ul","var","video","wbr"]),pn=D(["svg","a","altglyph","altglyphdef","altglyphitem","animatecolor","animatemotion","animatetransform","circle","clippath","defs","desc","ellipse","enterkeyhint","exportparts","filter","font","g","glyph","glyphref","hkern","image","inputmode","line","lineargradient","marker","mask","metadata","mpath","part","path","pattern","polygon","polyline","radialgradient","rect","stop","style","switch","symbol","text","textpath","title","tref","tspan","view","vkern"]),hn=D(["feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feDistantLight","feDropShadow","feFlood","feFuncA","feFuncB","feFuncG","feFuncR","feGaussianBlur","feImage","feMerge","feMergeNode","feMorphology","feOffset","fePointLight","feSpecularLighting","feSpotLight","feTile","feTurbulence"]),ho=D(["animate","color-profile","cursor","discard","font-face","font-face-format","font-face-name","font-face-src","font-face-uri","foreignobject","hatch","hatchpath","mesh","meshgradient","meshpatch","meshrow","missing-glyph","script","set","solidcolor","unknown","use"]),dn=D(["math","menclose","merror","mfenced","mfrac","mglyph","mi","mlabeledtr","mmultiscripts","mn","mo","mover","mpadded","mphantom","mroot","mrow","ms","mspace","msqrt","mstyle","msub","msup","msubsup","mtable","mtd","mtext","mtr","munder","munderover","mprescripts"]),go=D(["maction","maligngroup","malignmark","mlongdiv","mscarries","mscarry","msgroup","mstack","msline","msrow","semantics","annotation","annotation-xml","mprescripts","none"]),Br=D(["#text"]),Ur=D(["accept","action","align","alt","autocapitalize","autocomplete","autopictureinpicture","autoplay","background","bgcolor","border","capture","cellpadding","cellspacing","checked","cite","class","clear","color","cols","colspan","command","commandfor","controls","controlslist","coords","crossorigin","datetime","decoding","default","dir","disabled","disablepictureinpicture","disableremoteplayback","download","draggable","enctype","enterkeyhint","exportparts","face","for","headers","height","hidden","high","href","hreflang","id","inert","inputmode","integrity","ismap","kind","label","lang","list","loading","loop","low","max","maxlength","media","method","min","minlength","multiple","muted","name","nonce","noshade","novalidate","nowrap","open","optimum","part","pattern","placeholder","playsinline","popover","popovertarget","popovertargetaction","poster","preload","pubdate","radiogroup","readonly","rel","required","rev","reversed","role","rows","rowspan","spellcheck","scope","selected","shape","size","sizes","slot","span","srclang","start","src","srcset","step","style","summary","tabindex","title","translate","type","usemap","valign","value","width","wrap","xmlns"]),gn=D(["accent-height","accumulate","additive","alignment-baseline","amplitude","ascent","attributename","attributetype","azimuth","basefrequency","baseline-shift","begin","bias","by","class","clip","clippathunits","clip-path","clip-rule","color","color-interpolation","color-interpolation-filters","color-profile","color-rendering","cx","cy","d","dx","dy","diffuseconstant","direction","display","divisor","dominant-baseline","dur","edgemode","elevation","end","exponent","fill","fill-opacity","fill-rule","filter","filterunits","flood-color","flood-opacity","font-family","font-size","font-size-adjust","font-stretch","font-style","font-variant","font-weight","fx","fy","g1","g2","glyph-name","glyphref","gradientunits","gradienttransform","height","href","id","image-rendering","in","in2","intercept","k","k1","k2","k3","k4","kerning","keypoints","keysplines","keytimes","lang","lengthadjust","letter-spacing","kernelmatrix","kernelunitlength","lighting-color","local","marker-end","marker-mid","marker-start","markerheight","markerunits","markerwidth","maskcontentunits","maskunits","max","mask","mask-type","media","method","mode","min","name","numoctaves","offset","operator","opacity","order","orient","orientation","origin","overflow","paint-order","path","pathlength","patterncontentunits","patterntransform","patternunits","pointer-events","points","preservealpha","preserveaspectratio","primitiveunits","r","rx","ry","radius","refx","refy","repeatcount","repeatdur","restart","result","rotate","scale","seed","shape-rendering","slope","specularconstant","specularexponent","spreadmethod","startoffset","stddeviation","stitchtiles","stop-color","stop-opacity","stroke-dasharray","stroke-dashoffset","stroke-linecap","stroke-linejoin","stroke-miterlimit","stroke-opacity","stroke","stroke-width","style","surfacescale","systemlanguage","tabindex","tablevalues","targetx","targety","transform","transform-origin","text-anchor","text-decoration","text-orientation","text-rendering","textlength","type","u1","u2","unicode","values","vector-effect","viewbox","visibility","version","vert-adv-y","vert-origin-x","vert-origin-y","width","word-spacing","wrap","writing-mode","xchannelselector","ychannelselector","x","x1","x2","xmlns","y","y1","y2","z","zoomandpan"]),Fr=D(["accent","accentunder","align","bevelled","close","columnalign","columnlines","columnspacing","columnspan","denomalign","depth","dir","display","displaystyle","encoding","fence","frame","height","href","id","largeop","length","linethickness","lquote","lspace","mathbackground","mathcolor","mathsize","mathvariant","maxsize","minsize","movablelimits","notation","numalign","open","rowalign","rowlines","rowspacing","rowspan","rspace","rquote","scriptlevel","scriptminsize","scriptsizemultiplier","selection","separator","separators","stretchy","subscriptshift","supscriptshift","symmetric","voffset","width","xmlns"]),ht=D(["xlink:href","xml:id","xlink:title","xml:space","xmlns:xlink"]),mo=M(/{{[\w\W]*|^[\w\W]*}}/g),bo=M(/<%[\w\W]*|^[\w\W]*%>/g),ko=M(/\${[\w\W]*/g),To=M(/^data-[\-\w.\u00B7-\uFFFF]+$/),yo=M(/^aria-[\-\w]+$/),Hr=M(/^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i),xo=M(/^(?:\w+script|data):/i),wo=M(/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g),_o=M(/^html$/i),Ao=M(/^[a-z][.\w]*(-[.\w]+)+$/i),mn=M(/<[/\w!]/g),Gr=M(/<[/\w]/g),So=M(/<\/no(script|embed|frames)/i),Wr=M(/\/>/i),L={element:1,attribute:2,text:3,cdataSection:4,entityReference:5,entityNode:6,processingInstruction:7,comment:8,document:9,documentType:10,documentFragment:11,notation:12},Eo=D(y({},["style","script","xmp","iframe","noembed","noframes","plaintext","noscript"])),vo=function(){return typeof window>"u"?null:window},Ro=function(e,n){if(typeof e!="object"||typeof e.createPolicy!="function")return null;let r=null,i="data-tt-policy-suffix";n&&n.hasAttribute(i)&&(r=n.getAttribute(i));let o="dompurify"+(r?"#"+r:"");try{return e.createPolicy(o,{createHTML(l){return l},createScriptURL(l){return l}})}catch{return console.warn("TrustedTypes policy "+o+" could not be created."),null}},jr=function(){return{afterSanitizeAttributes:[],afterSanitizeElements:[],afterSanitizeShadowDOM:[],beforeSanitizeAttributes:[],beforeSanitizeElements:[],beforeSanitizeShadowDOM:[],uponSanitizeAttribute:[],uponSanitizeElement:[],uponSanitizeShadowNode:[]}},fe=function(e,n,r,i){return W(e,n)&&Ce(e[n])?y(i.base?j(i.base):{},e[n],i.transform):r},bn=function(e,n,r){let i=W(e,n)?e[n]:void 0;return i&&typeof i=="object"?j(i):r()};function Kr(){let t=arguments.length>0&&arguments[0]!==void 0?arguments[0]:vo(),e=h=>Kr(h);if(e.version="3.4.17",e.removed=[],!t||!t.document||t.document.nodeType!==L.document||!t.Element)return e.isSupported=!1,e;let n=t.document,r=n,i=r.currentScript;t.DocumentFragment;let o=t.HTMLTemplateElement,l=t.Node,c=t.Element,p=t.NodeFilter;t.NamedNodeMap===void 0&&(t.NamedNodeMap||t.MozNamedAttrMap),t.HTMLFormElement;let d=t.DOMParser,g=t.trustedTypes,k=c.prototype,x=q(k,"cloneNode"),N=q(k,"remove"),A=q(k,"removeAttributeNode"),U=q(k,"nextSibling"),se=q(k,"childNodes"),V=q(k,"parentNode"),ye=q(k,"shadowRoot"),xe=q(k,"attributes"),Z=l&&l.prototype?q(l.prototype,"nodeType"):null,oe=l&&l.prototype?q(l.prototype,"nodeName"):null,ae=l&&l.prototype?q(l.prototype,"ownerDocument"):null,I=function(s){return Z?Z(s):s.nodeType},Ie=function(s){return oe?oe(s):s.nodeName},yn=fo(k,"namespaceURI"),dt=function(s){return yn?yn(s):s.namespaceURI};if(typeof o=="function"){let h=n.createElement("template");h.content&&h.content.ownerDocument&&(n=h.content.ownerDocument)}let F,pe="",gt,xn=!1,De=0,wn=function(){if(De>0)throw ie('A configured TRUSTED_TYPES_POLICY callback (createHTML or createScriptURL) must not call DOMPurify.sanitize, as that causes infinite recursion. Do not pass a policy whose callbacks wrap DOMPurify as TRUSTED_TYPES_POLICY; see the "DOMPurify and Trusted Types" section of the README.')},we=function(s){wn(),De++;try{return F.createHTML(s)}finally{De--}},ei=function(s){wn(),De++;try{return F.createScriptURL(s)}finally{De--}},ti=function(){return xn||(gt=Ro(g,i),xn=!0),gt},Ve=n,mt=Ve.implementation,_n=Ve.createNodeIterator,ni=Ve.createDocumentFragment,ri=Ve.getElementsByTagName,ii=r.importNode,S=jr();e.isSupported=typeof qr=="function"&&typeof V=="function"&&mt&&mt.createHTMLDocument!==void 0;let si=mo,oi=bo,ai=ko,li=To,ci=yo,ui=xo,An=wo,fi=Ao,Sn=Hr,E=null,bt=y({},[...$r,...pn,...hn,...dn,...Br]),v=null,kt=y({},[...Ur,...gn,...Fr,...ht]),X=Object.seal(Ne(null,{tagNameCheck:{writable:!0,configurable:!1,enumerable:!0,value:null},attributeNameCheck:{writable:!0,configurable:!1,enumerable:!0,value:null},allowCustomizedBuiltInElements:{writable:!0,configurable:!1,enumerable:!0,value:!1}})),Pe=null,En=null,le=Object.seal(Ne(null,{tagCheck:{writable:!0,configurable:!1,enumerable:!0,value:null},attributeCheck:{writable:!0,configurable:!1,enumerable:!0,value:null}})),vn=!0,Tt=!0,Rn=!1,yt=!0,ee=!1,he=!0,de=!1,xt=!1,Ze=null,Xe=null,wt=!1,_e=!1,Ke=!1,Qe=!1,On=!0,Ln=!1,Nn="user-content-",_t=!0,At=!1,ge=null,Ae={},me=null,Cn=y({},["annotation-xml","audio","colgroup","desc","foreignobject","head","iframe","math","mi","mn","mo","ms","mtext","noembed","noframes","noscript","plaintext","script","selectedcontent","style","svg","template","thead","title","video","xmp"]),In=null,Dn=y({},["audio","video","img","source","image","track"]),Pn=null,Mn=y({},["alt","class","for","id","label","name","pattern","placeholder","role","summary","title","value","style","xmlns"]),Je="http://www.w3.org/1998/Math/MathML",et="http://www.w3.org/2000/svg",K="http://www.w3.org/1999/xhtml",Se=K,St=!1,Et=null,pi=y({},[Je,et,K],fn),zn=D(["mi","mo","mn","ms","mtext"]),vt=y({},zn),$n=D(["annotation-xml"]),Rt=y({},$n),hi=y({},["title","style","font","a","script"]),Me=null,di=["application/xhtml+xml","text/html"],gi="text/html",O=null,Ee=null,mi=n.createElement("form"),Bn=function(s){return s instanceof RegExp||s instanceof Function},Ot=function(){let s=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{};if(Ee&&Ee===s)return;(!s||typeof s!="object")&&(s={}),s=j(s),Me=di.indexOf(s.PARSER_MEDIA_TYPE)===-1?gi:s.PARSER_MEDIA_TYPE,O=Me==="application/xhtml+xml"?fn:Te,E=fe(s,"ALLOWED_TAGS",bt,{transform:O}),v=fe(s,"ALLOWED_ATTR",kt,{transform:O}),Et=fe(s,"ALLOWED_NAMESPACES",pi,{transform:fn}),Pn=fe(s,"ADD_URI_SAFE_ATTR",Mn,{transform:O,base:Mn}),In=fe(s,"ADD_DATA_URI_TAGS",Dn,{transform:O,base:Dn}),me=fe(s,"FORBID_CONTENTS",Cn,{transform:O}),Pe=fe(s,"FORBID_TAGS",j({}),{transform:O}),En=fe(s,"FORBID_ATTR",j({}),{transform:O}),Ae=W(s,"USE_PROFILES")?s.USE_PROFILES&&typeof s.USE_PROFILES=="object"?j(s.USE_PROFILES):s.USE_PROFILES:!1,vn=s.ALLOW_ARIA_ATTR!==!1,Tt=s.ALLOW_DATA_ATTR!==!1,Rn=s.ALLOW_UNKNOWN_PROTOCOLS||!1,yt=s.ALLOW_SELF_CLOSE_IN_ATTR!==!1,ee=s.SAFE_FOR_TEMPLATES||!1,he=s.SAFE_FOR_XML!==!1,de=s.WHOLE_DOCUMENT||!1,_e=s.RETURN_DOM||!1,Ke=s.RETURN_DOM_FRAGMENT||!1,Qe=s.RETURN_TRUSTED_TYPE||!1,wt=s.FORCE_BODY||!1,On=s.SANITIZE_DOM!==!1,Ln=s.SANITIZE_NAMED_PROPS||!1,_t=s.KEEP_CONTENT!==!1,At=s.IN_PLACE||!1,Sn=po(s.ALLOWED_URI_REGEXP)?s.ALLOWED_URI_REGEXP:Hr,Se=typeof s.NAMESPACE=="string"?s.NAMESPACE:K,vt=bn(s,"MATHML_TEXT_INTEGRATION_POINTS",()=>y({},zn)),Rt=bn(s,"HTML_INTEGRATION_POINTS",()=>y({},$n));let a=bn(s,"CUSTOM_ELEMENT_HANDLING",()=>Ne(null));if(X=Ne(null),W(a,"tagNameCheck")&&Bn(a.tagNameCheck)&&(X.tagNameCheck=a.tagNameCheck),W(a,"attributeNameCheck")&&Bn(a.attributeNameCheck)&&(X.attributeNameCheck=a.attributeNameCheck),W(a,"allowCustomizedBuiltInElements")&&typeof a.allowCustomizedBuiltInElements=="boolean"&&(X.allowCustomizedBuiltInElements=a.allowCustomizedBuiltInElements),M(X),ee&&(Tt=!1),Ke&&(_e=!0),Ae&&(E=y({},Br),v=Ne(null),Ae.html===!0&&(y(E,$r),y(v,Ur)),Ae.svg===!0&&(y(E,pn),y(v,gn),y(v,ht)),Ae.svgFilters===!0&&(y(E,hn),y(v,gn),y(v,ht)),Ae.mathMl===!0&&(y(E,dn),y(v,Fr),y(v,ht))),le.tagCheck=null,le.attributeCheck=null,W(s,"ADD_TAGS")&&(typeof s.ADD_TAGS=="function"?le.tagCheck=s.ADD_TAGS:Ce(s.ADD_TAGS)&&(E===bt&&(E=j(E)),y(E,s.ADD_TAGS,O))),W(s,"ADD_ATTR")&&(typeof s.ADD_ATTR=="function"?le.attributeCheck=s.ADD_ATTR:Ce(s.ADD_ATTR)&&(v===kt&&(v=j(v)),y(v,s.ADD_ATTR,O))),W(s,"ADD_FORBID_CONTENTS")&&Ce(s.ADD_FORBID_CONTENTS)&&(me===Cn&&(me=j(me)),y(me,s.ADD_FORBID_CONTENTS,O)),_t&&(E["#text"]=!0),de&&y(E,["html","head","body"]),E.table&&(y(E,["tbody"]),delete Pe.tbody),s.TRUSTED_TYPES_POLICY){if(typeof s.TRUSTED_TYPES_POLICY.createHTML!="function")throw ie('TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.');if(typeof s.TRUSTED_TYPES_POLICY.createScriptURL!="function")throw ie('TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.');let u=F;F=s.TRUSTED_TYPES_POLICY;try{pe=we("")}catch(f){throw F=u,f}}else s.TRUSTED_TYPES_POLICY===null?(F=void 0,pe=""):(F===void 0&&(F=ti()),F&&typeof pe=="string"&&(pe=we("")));D&&D(s),Ee=s},Un=y({},[...pn,...hn,...ho]),Fn=y({},[...dn,...go]),bi=function(s,a,u){return a.namespaceURI===K?s==="svg":a.namespaceURI===Je?s==="svg"&&(u==="annotation-xml"||vt[u]):!!Un[s]},ki=function(s,a,u){return a.namespaceURI===K?s==="math":a.namespaceURI===et?s==="math"&&Rt[u]:!!Fn[s]},Ti=function(s,a,u){return a.namespaceURI===et&&!Rt[u]||a.namespaceURI===Je&&!vt[u]?!1:!Fn[s]&&(hi[s]||!Un[s])},yi=function(s){let a=dt(s),u=Te(Ie(s)),f=V(s),m,b;return f&&I(f)===L.element?(m={namespaceURI:dt(f)},b=Te(Ie(f))):(m={namespaceURI:Se},b="template"),Et[a]?a===et?bi(u,m,b):a===Je?ki(u,m,b):a===K?Ti(u,m,b):!!(Me==="application/xhtml+xml"&&Et[a]):!1},ce=function(s){We(e.removed,{element:s});try{V(s).removeChild(s)}catch{if(N(s),!V(s))throw ie("a node selected for removal could not be detached from its tree and cannot be safely returned; refusing to sanitize in place")}},Hn=function(s,a,u){try{A(s,a)}catch{try{s.removeAttribute(u)}catch{}}},Lt=function(s){Ct(s);let a=se(s);a&&re(io(a),f=>{try{N(f)}catch{}});let u=I(s)===L.element?xe(s):null;if(u)for(let f=u.length-1;f>=0;--f){let m=u[f],b=m&&m.name;typeof b=="string"&&Hn(s,m,b)}},ve=function(s,a,u){if(!u)try{u=a.getAttributeNode(s)}catch{u=null}We(e.removed,{attribute:u||null,from:a});try{u?A(a,u):a.removeAttribute(s)}catch{try{a.removeAttribute(s)}catch{}}if(s==="is")if(_e||Ke)try{ce(a)}catch{}else try{a.setAttribute(s,"")}catch{}},Gn=function(s){let a=xe(s);if(a)for(let u=a.length-1;u>=0;--u){let f=a[u],m=f&&f.name;typeof m!="string"||v[O(m)]||Hn(s,f,m)}},Nt=function(s,a){let u=arguments.length>2&&arguments[2]!==void 0?arguments[2]:!1,f=[s];for(;f.length>0;){let m=f.pop();if(a(m)===!1)continue;if(u&&I(m)===L.element){let T=ye(m);ue(T)&&f.push(T)}let b=se(m);if(b)for(let T=b.length-1;T>=0;--T)f.push(b[T])}},Ct=function(s){Nt(s,a=>{I(a)===L.element&&Gn(a)})},It=function(s){let a=[];return Nt(s,u=>{a.push(u)},!0),a},xi=function(s,a){let u=cn();re(It(s),f=>{I(f)===L.element&&un(u,f)}),re(a,f=>{I(f)===L.element&&!je(u,f)&&Gn(f)})},Wn=function(s,a){let u=!1;return re(e.removed,f=>{f.element&&(u=u||f.element===s,Ct(f.element))}),xi(s,a),u},wi=8,_i=function(s,a){let u=ge,f=null,m=()=>(f||(f=cn(),re(a,b=>{un(f,b)})),f);for(let b=0;;b++){let T=It(s),C=[s],Q=!1;if(re(T,$=>{I($)===L.documentFragment?We(C,$):!Q&&!je(u,$)&&(Q=je(m(),$))}),!Q)return;if(b>=wi)throw ie("the tree kept changing during in-place sanitization; refusing to return it");re(C,($,H)=>{Ai($,H>0,s,m())})}},Ai=function(s,a,u,f){let m=Dt(s),b;for(;b=m.nextNode();)!je(f,b)||je(ge,b)||(a&&Y(S.uponSanitizeShadowNode,b,null),Mt(b,u),zt(b,u),ue(b.content)&&$e(b.content))},Si=function(s){ge&&un(ge,s)},jn=function(s,a){return he?s==="patchsrc"?!0:s==="for"&&a!=="label"&&a!=="output":!1},Ei=function(s){he&&Nt(s,a=>{let u=I(a);if(u===L.processingInstruction||u===L.comment&&P(Gr,a.data)){try{N(a)}catch{}return!1}if(u===L.element){let f=a,m=O(Ie(a));try{f.hasAttribute&&f.hasAttribute("patchsrc")&&f.removeAttribute("patchsrc"),f.hasAttribute&&f.hasAttribute("for")&&jn("for",m)&&f.removeAttribute("for")}catch{}}return!0})},qn=function(s){let a=null,u=null;if(wt)s="<remove></remove>"+s;else{let b=Dr(s,/^[\r\n\t ]+/);u=b&&b[0]}Me==="application/xhtml+xml"&&Se===K&&(s='<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>'+s+"</body></html>");let f=F?we(s):s;if(Se===K)try{a=new d().parseFromString(f,Me)}catch{}if(!a||!a.documentElement){a=mt.createDocument(Se,"template",null);try{a.documentElement.innerHTML=St?pe:f}catch{}}let m=a.body||a.documentElement;return s&&u&&m.insertBefore(n.createTextNode(u),m.childNodes[0]||null),Se===K?ri.call(a,de?"html":"body")[0]:de?a.documentElement:m},Dt=function(s){let a=ae?ae(s):s.ownerDocument;return _n.call(a||s,s,p.SHOW_ELEMENT|p.SHOW_COMMENT|p.SHOW_TEXT|p.SHOW_PROCESSING_INSTRUCTION|p.SHOW_CDATA_SECTION,null)},tt=function(s){return s=qe(s,si," "),s=qe(s,oi," "),s=qe(s,ai," "),s},Pt=function(s){var a;Yn(s);let u=(a=s.querySelectorAll)===null||a===void 0?void 0:a.call(s,"template");u&&re(u,f=>{ue(f.content)&&Pt(f.content)})},Yn=function(s){s.normalize();let a=ae?ae(s):s.ownerDocument,u=_n.call(a||s,s,p.SHOW_TEXT|p.SHOW_COMMENT|p.SHOW_CDATA_SECTION|p.SHOW_PROCESSING_INSTRUCTION,null),f=u.nextNode();for(;f;)f.data=tt(f.data),f=u.nextNode()},nt=function(s){let a=oe?oe(s):null;return typeof a!="string"||O(a)!=="form"?!1:typeof s.nodeName!="string"||typeof s.textContent!="string"||typeof s.removeChild!="function"||s.attributes!==xe(s)||typeof s.removeAttribute!="function"||typeof s.removeAttributeNode!="function"||typeof s.getAttributeNode!="function"||typeof s.setAttribute!="function"||typeof s.namespaceURI!="string"||typeof s.insertBefore!="function"||typeof s.hasChildNodes!="function"||s.nodeType!==Z(s)||s.childNodes!==se(s)},ue=function(s){if(!Z||typeof s!="object"||s===null)return!1;try{return Z(s)===L.documentFragment}catch{return!1}},ze=function(s){if(!Z||typeof s!="object"||s===null)return!1;try{return typeof Z(s)=="number"}catch{return!1}};function Y(h,s,a){h.length!==0&&re(h,u=>{u.call(e,s,a,Ee)})}let vi=function(s,a){return!!(he&&s.hasChildNodes()&&!ze(s.firstElementChild)&&P(mn,s.textContent)&&P(mn,s.innerHTML)||he&&Eo[a]&&I(s)===L.element&&dt(s)===K&&(ze(s.firstElementChild)||typeof s.textContent=="string"&&P(mn,s.textContent))||s.nodeType===L.processingInstruction||he&&s.nodeType===L.comment&&P(Gr,s.data))},rt=function(s,a){if(s instanceof RegExp)return P(s,a);if(s instanceof Function){for(var u=arguments.length,f=new Array(u>2?u-2:0),m=2;m<u;m++)f[m-2]=arguments[m];return!!s(a,...f)}return!1},Ri=function(s,a,u){if(!Pe[a]&&Xn(a)&&rt(X.tagNameCheck,a))return!1;if(_t&&!me[a]&&!me[Te(a)]){let f=V(s),m=se(s);if(m&&f){let b=m.length;for(let T=b-1;T>=0;--T){let C=s===u?x(m[T],!0):m[T];f.insertBefore(C,U(s))}}}return ce(s),!0},Vn=function(s,a,u,f){return s.length===0?a:a===u||a===f?j(a):a},Re=function(s,a){return s===a||V(s)!==null?!1:(At&&Ct(s),!0)},Mt=function(s,a){if(Si(s),Y(S.beforeSanitizeElements,s,null),Re(s,a))return!0;if(nt(s))return ce(s),!0;let u=O(Ie(s));if(E=Vn(S.uponSanitizeElement,E,bt,Ze),Y(S.uponSanitizeElement,s,{tagName:u,allowedTags:E}),Re(s,a))return!0;if(vi(s,u))return ce(s),!0;if(Pe[u]||!(le.tagCheck instanceof Function&&le.tagCheck(u))&&!E[u]){let f=Ri(s,u,a);return f===!1&&(Y(S.afterSanitizeElements,s,null),Re(s,a))?!0:f}if(I(s)===L.element&&!yi(s)||(u==="noscript"||u==="noembed"||u==="noframes")&&P(So,s.innerHTML))return ce(s),!0;if(ee&&s.nodeType===L.text){let f=tt(s.textContent);s.textContent!==f&&(We(e.removed,{element:s.cloneNode()}),s.textContent=f)}return Y(S.afterSanitizeElements,s,null),Re(s,a)},Zn=function(s,a,u){if(En[a]||jn(a,s)||On&&(a==="id"||a==="name")&&(u in n||u in mi))return!1;let f=v[a]||le.attributeCheck instanceof Function&&le.attributeCheck(a,s);return Tt&&P(li,a)||vn&&P(ci,a)?!0:f?Pn[a]||P(Sn,qe(u,An,""))||(a==="src"||a==="xlink:href"||a==="href")&&s!=="script"&&Pr(u,"data:")===0&&In[s]||Rn&&!P(ui,qe(u,An,""))?!0:!u:Xn(s)&&rt(X.tagNameCheck,s)&&rt(X.attributeNameCheck,a,s)||a==="is"&&X.allowCustomizedBuiltInElements&&rt(X.tagNameCheck,u)},Oi=y({},["annotation-xml","color-profile","font-face","font-face-format","font-face-name","font-face-src","font-face-uri","missing-glyph"]),Xn=function(s){return!Oi[Te(s)]&&P(fi,s)},Li=function(s,a,u,f){if(F&&typeof g=="object"&&typeof g.getAttributeType=="function"&&!u)switch(g.getAttributeType(s,a)){case"TrustedHTML":return we(f);case"TrustedScriptURL":return ei(f)}return f},Ni=function(s,a,u,f){try{return u?s.setAttributeNS(u,a,f):s.setAttribute(a,f),nt(s)?(ce(s),!1):!0}catch{return ve(a,s),!1}},Kn=function(s,a){return he&&P(/((--!?|])>)|<\/(style|script|title|xmp|textarea|noscript|iframe|noembed|noframes)/i,a)?!0:Te(s)==="attributename"&&Dr(a,"href")!==null},zt=function(s,a){if(Y(S.beforeSanitizeAttributes,s,null),Re(s,a))return;let u=s.attributes;if(!u||nt(s))return;v=Vn(S.uponSanitizeAttribute,v,kt,Xe);let f={attrName:"",attrValue:"",keepAttr:!0,allowedAttributes:v,forceKeepAttr:void 0},m=u.length,b=O(s.nodeName);for(;m--;){let T=u[m],C=T.name,Q=T.namespaceURI,$=T.value,H=O(C),Oe=$,G=C==="value"?Oe:oo(Oe),Qn=!1;if(f.attrName=H,f.attrValue=G,f.keepAttr=!0,f.forceKeepAttr=void 0,Y(S.uponSanitizeAttribute,s,f),G=f.attrValue,Ln&&(H==="id"||H==="name")&&Pr(G,Nn)!==0&&(ve(C,s,T),G=Nn+G,Qn=!0),Kn(C,G)){ve(C,s,T);continue}if(!f.forceKeepAttr){if(!f.keepAttr){ve(C,s,T);continue}if(!yt&&P(Wr,G)){ve(C,s,T);continue}if(ee&&(G=tt(G)),!Zn(b,H,G)){ve(C,s,T);continue}G=Li(b,H,Q,G),G!==Oe&&Ni(s,C,Q,G)&&Qn&&Ir(e.removed)}}Y(S.afterSanitizeAttributes,s,null),Re(s,a)},$e=function(s){let a=null,u=Dt(s);for(Y(S.beforeSanitizeShadowDOM,s,null);a=u.nextNode();)if(Y(S.uponSanitizeShadowNode,a,null),Mt(a,s),zt(a,s),ue(a.content)&&$e(a.content),I(a)===L.element){let f=ye(a);ue(f)&&($t(f),$e(f))}ee&&Yn(s),Y(S.afterSanitizeShadowDOM,s,null)},$t=function(s){let a=[{node:s,shadow:null}];for(;a.length>0;){let u=a.pop();if(u.shadow){$e(u.shadow);continue}let f=u.node,m=I(f)===L.element,b=se(f);if(b)for(let T=b.length-1;T>=0;--T)a.push({node:b[T],shadow:null});if(m){let T=oe?oe(f):null;if(typeof T=="string"&&O(T)==="template"){let C=f.content;ue(C)&&a.push({node:C,shadow:null})}}if(m){let T=ye(f);ue(T)&&a.push({node:null,shadow:T},{node:T,shadow:null})}}};return e.sanitize=function(h){let s=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},a=null,u=null,f=null,m=null;if(St=!h,St&&(h="<!-->"),typeof h!="string"&&!ze(h)&&(h=uo(h),typeof h!="string"))throw ie("dirty is not a string, aborting");if(!e.isSupported)return h;xt?(E=Ze,v=Xe):Ot(s),(S.uponSanitizeElement.length>0||S.uponSanitizeAttribute.length>0)&&(E=j(E)),S.uponSanitizeAttribute.length>0&&(v=j(v)),e.removed=[];let b=At&&typeof h!="string"&&ze(h),T=[],C=ge;if(b){Ei(h);let H=Ie(h);if(typeof H=="string"){let Oe=O(H);if(!E[Oe]||Pe[Oe])throw Lt(h),ie("root node is forbidden and cannot be sanitized in-place")}if(nt(h))throw Lt(h),ie("root node is clobbered and cannot be sanitized in-place");T=It(h),ge=cn()}else if(ze(h))a=qn("<!---->"),u=a.ownerDocument.importNode(h,!0),u.nodeType===L.element&&u.nodeName==="BODY"||u.nodeName==="HTML"?a=u:a.appendChild(u),$t(a);else{if(!_e&&!ee&&!de&&h.indexOf("<")===-1)return F&&Qe?we(h):h;if(a=qn(h),!a)return _e?null:Qe?pe:""}a&&wt&&ce(a.firstChild);let Q=b?h:a;try{b&&$t(h);let H=Dt(Q);for(;f=H.nextNode();)Mt(f,Q),zt(f,Q),ue(f.content)&&$e(f.content);b&&_i(h,T)}catch(H){throw b&&(Lt(h),Wn(h,T)),H}finally{ge=C}if(b){if(Wn(h,T))throw ie("a node selected for removal could not be safely returned; refusing to sanitize in place");return ee&&Pt(h),h}if(_e){if(ee&&Pt(a),Ke)for(m=ni.call(a.ownerDocument);a.firstChild;)m.appendChild(a.firstChild);else m=a;return(v.shadowroot||v.shadowrootmode)&&(m=ii.call(r,m,!0)),m}let $=de?a.outerHTML:a.innerHTML;return de&&E["!doctype"]&&a.ownerDocument&&a.ownerDocument.doctype&&a.ownerDocument.doctype.name&&P(_o,a.ownerDocument.doctype.name)&&($="<!DOCTYPE "+a.ownerDocument.doctype.name+`>
`+$),ee&&($=tt($)),F&&Qe?we($):$},e.setConfig=function(){let h=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{};Ot(h),xt=!0,Ze=E,Xe=v},e.clearConfig=function(){Ee=null,xt=!1,Ze=null,Xe=null,F=gt,pe=""},e.isValidAttribute=function(h,s,a){Ee||Ot({});let u=O(h),f=O(s);return typeof a=="string"&&(Kn(s,a)||!yt&&P(Wr,a))?!1:Zn(u,f,a)},e.addHook=function(h,s){typeof s=="function"&&W(S,h)&&We(S[h],s)},e.removeHook=function(h,s){if(W(S,h)){if(s!==void 0){let a=ro(S[h],s);return a===-1?void 0:so(S[h],a,1)[0]}return Ir(S[h])}},e.removeHooks=function(h){W(S,h)&&(S[h]=[])},e.removeAllHooks=function(){S=jr()},e}var Qr=Kr();w.setOptions({gfm:!0,breaks:!1});var Jr=new Ge({headingStyle:"atx",hr:"---",bulletListMarker:"-",codeBlockStyle:"fenced",fence:"```",emDelimiter:"*",strongDelimiter:"**",linkStyle:"inlined"});Jr.use(Lr);return zi(Oo);})();


    const NS = 'dsh-curate'
    const ROUTE_PREFIX = '/dsh-curate'
    // scripts/build-client.mjs replaces this marker with the package.json
    // version, so the client half never carries a hand-maintained version.
    const PLUGIN_VERSION = '0.5.1'
    const DRAFT_PREFIX = 'dsh-curate:draft:'
    const DRAFT_VERSION = 4
    const DRAFT_VERSIONS = new Set([2, 3, 4])
    const PRESERVE_TURNS_MAX = 6
    // Large detail expansions render in pages instead of one giant pass.
    const DETAIL_PAGE_SIZE = 80
    const STYLE_ID = 'dsh-curate-styles'
    const TAB_KIND = 'dsh-curate'

    const zh = {
      'tab.title': '上下文整理',
      'action.open': '整理上下文',
      'action.title': '打开上下文整理工作台（人工筛选、改写，再压缩）',
      'panel.title': '上下文整理',
      'panel.subtitle': '由你决定哪些重要，也可以改写任何消息。压缩时由模型生成替代摘要；被替换的原文不再进入模型上下文。',
      'panel.close': '关闭',
      'panel.loading': '正在读取会话上下文…',
      'panel.retry': '重试',
      'panel.refresh': '刷新上下文',
      'panel.empty': '这条会话还没有可整理的对话。',
      'panel.busy': '会话正在工作，等当前回合结束后再整理。',
      'stats.surface': '可见约 {tokens} tokens',
      'stats.selected': '选入 {count} 段 · {tokens} tokens',
      'stats.after': '压缩后约 {tokens} tokens',
      'stats.saved': '节省 {tokens} tokens',
      'scope.title': '最近保留',
      'scope.suffix': '轮不压缩',
      'scope.note': '最后一条消息永远保留；工具调用与结果不会被拆开。',
      'tone.keep': '重要',
      'tone.normal': '一般',
      'tone.minor': '次要',
      'tone.keep.hint': '整段原文保留，不进入压缩。',
      'tone.mixed': '混合',
      'segment.keep.note': '原文保留，不进入压缩。',
      'segment.range': '#{start}–#{end} · {count} 条',
      'segment.hidden': '含 {count} 条已隐藏的工具/上下文',
      'tone.normal.hint': '压缩时由模型生成常规摘要，保留关键细节。',
      'tone.minor.hint': '压缩时由模型生成更短摘要，只留结论与错误。',
      'locked.badge': '最近对话',
      'locked.override': '已覆盖',
      'tail.badge': '当前消息 · 固定保留',
      'group.range': '第 {turn} 轮',
      'group.noTurn': '独立消息',
      'group.counts': '用户 {user} · 助手 {assistant} · 工具 {tool}',
      'group.tokens': '约 {tokens} tokens',
      'content.hint': '共 {count} 条消息 · 显示预览',
      'content.expand': '查看完整原文',
      'content.loading': '正在读取原文…',
      'content.collapse': '收起完整原文',
      'content.loaded': '已显示 {count} 条消息的完整原文',
      'content.showMore': '再显示 {count} 条',
      'content.failed': '读取原文失败：{error}',
      'segment.autoSummary': '压缩时自动生成摘要。',
      'group.view.source': '源码',
      'group.view.rendered': '渲染',
      'group.split': '拆分',
      'group.merge': '合并下一段',
      'group.keep.note': '整段原文保留，不压缩。',
      'footer.apply': '应用到上下文',
      'footer.cancel': '取消',
      'footer.nothing': '还没有选入任何要压缩的段落。',
      'confirm.title': '应用后无法撤销',
      'confirm.body': '即将替换 {count} 个压缩区间，共 {messages} 条原始消息。它们将不再进入模型上下文；原始内容已备份到本地文件，但会话内的消息无法通过撤销恢复。',
      'confirm.keep': '同轮还有 {kept} 条标记为重要的消息会原文保留。',
      'confirm.backup': '备份位置：{path}',
      'confirm.check': '我理解：应用后原始消息不再进入模型上下文，且会话内无法撤销。',
      'confirm.apply': '确认应用',
      'confirm.cancel': '再检查一下',
      'apply.failed': '应用失败：{error}',
      'apply.stale': '会话在打开工作台后有了新消息，请刷新后重新整理。',
      'apply.partial': '写入中断：已应用 {done}/{total} 个块。请保留备份并检查会话。',
      'done.title': '已完成上下文整理',
      'done.applied': '已替换 {count} 个块',
      'done.backup': '原文备份：{path}',
      'done.check': '回话后原始消息不再出现在模型上下文中。',
      'done.close': '关闭',
      'toast.select': '请先给至少一个段落选择“一般”或“次要”。',
      'toast.noSplit': '这一段无法在不拆开工具调用的情况下切分。',
      'toast.saved': '草稿已保存到本地。',
      'toast.saveFailed': '草稿保存失败：浏览器存储不可用或空间已满，请先复制需要保留的内容。',
      'toast.mergeLocked': '下一段属于最近保留的对话，不能合并。',
      'draft.restored': '已恢复你上次保存的草稿；会话之后有新消息，只保留了仍存在消息上的标注。',
      'draft.unrestorable': '上次保存的草稿所标注的消息已不在会话中，草稿已保留但无法恢复。',
      'edit.entry': '编辑',
      'edit.title.prompt': '编辑用户消息',
      'edit.title.reply': '编辑助手回复',
      'edit.save': '保存修改',
      'edit.cancel': '取消编辑',
      'edit.hint': '保存后先暂存，点底部「应用到上下文」才写入会话。',
      'edit.staged': '已修改（待应用）',
      'edit.undo': '撤销修改',
      'edit.unchanged': '没有检测到修改。',
      'edit.attachments': '这条消息带的 {count} 个附件会原样保留。',
      'edit.loading': '正在读取完整内容…',
      'edit.failed': '读取失败：{error}',
      'edit.readOnly': '这条消息不可编辑。',
      'edit.block': '编辑块',
      'edit.block.text': '正文',
      'edit.block.reasoning': '思维链',
      'edit.noPending': '没有待应用的修改。',
      'edit.blockSwitch': '切换编辑块会丢弃当前未保存的修改。',
      'edit.blockSwitch.confirm': '放弃修改并切换',
      'edit.placeholder': '在这里输入…',
      'edit.applied': '已应用 {count} 处修改。',
      'edit.unchangedCount': '{count} 处没有变化。',
      'edit.backup': '修改前备份：{path}',
      'edit.partial': '已应用 {done}/{total} 处修改，其余保留在工作台。',
      'edit.failedApply': '应用修改失败：{error}',
      'edit.stale': '会话在工作台打开后有了新消息，请刷新后重试。',
      'edit.busy': '会话正在工作，等当前回合结束后再应用。',
      'detail.loadFull': '查看完整内容',
      'detail.truncated': '内容较长，当前显示已截断。',
      'detail.reasoning': '思维链',
      'detail.toolCall': '工具调用',
      'detail.toolResult': '工具结果',
      'detail.attachments': '{count} 个附件',
      'detail.patched': '已改写',
      'compress.title': '压缩上下文',
      'compress.target': '压缩对象',
      'compress.method': '压缩方式',
      'compress.curated': '按整理结果压缩',
      'compress.curated.hint': '把选中的 {count} 段交给模型生成摘要并替换（共 {messages} 条原始消息）。',
      'compress.curated.unavailable': '还没有可压缩的段：先给至少一段选「一般」或「次要」。',
      'compress.official': '官方 /compact',
      'compress.official.hint': '由官方压缩器自行选择较早历史，压成一条摘要；不按上面的分段标注。',
      'compress.official.textOnly': '「压缩摘要只看对话文本」不影响官方 /compact，它仍读取完整历史。',
      'compress.official.unavailable': '当前宿主或 agent 预设没有提供官方 /compact；刚升级插件时请重启 DSH web。',
      'compress.pendingEdits': '还有 {count} 处修改没有应用；先应用或撤销它们，再压缩。',
      'compress.confirm': '确认压缩',
      'compress.cancel': '再检查一下',
      'compress.doneCurated': '已按整理结果压缩 {count} 段。',
      'compress.doneOfficial': '官方 /compact 完成，替换了 {count} 条历史。',
      'compress.nothing': '没有可压缩的历史。',
      'compress.failed': '压缩失败：{error}',
      'compress.running': '正在压缩…',
      'compress.irreversible': '我理解：压缩后原始消息不再进入模型上下文，且会话内无法撤销。',
      'compress.backup': '压缩前备份：{path}',
      'footer.compress': '压缩上下文',
      'footer.applyEdits': '修改并应用到上下文',
      'footer.save': '保存当前内容',
      'footer.undo': '撤销',
      'undo.empty': '没有可撤销的改动。',
      'undo.done': '已撤销上一步。',
      'panel.help': '说明',
      'compress.target.direct': '直接压缩上下文',
      'compress.target.direct.hint': '不应用暂存修改，按当前上下文压缩。',
      'compress.target.direct.pending': '直接压缩不会应用暂存的 {count} 处修改；压缩完成后这些暂存修改会被清除。',
      'compress.target.modified': '压缩修改后的上下文',
      'compress.target.modified.hint': '先应用 {count} 处修改，再压缩修改后的内容。',
      'compress.target.modified.none': '没有暂存修改，无法选择。',
      'footer.pending': '{count} 处修改待应用',
      'edit.title.tool': '编辑工具结果',
      'edit.title.context': '编辑注入上下文',
      'edit.toolArgsReadOnly': '结构化工具调用参数不可编辑。',
      'edit.entryHint': '点消息右上角「编辑」可改写正文、思维链、工具结果或注入上下文。',
      'view.all': '全部内容',
      'view.text': '仅对话文本',
      'view.hidden': '已隐藏 {count} 条工具/上下文',
      'view.note': '视图只影响查看与编辑；压缩仍覆盖整段。',
      'view.empty': '这一段没有可显示的对话文本。',
      'tail.hidden': '最后一条消息是工具/上下文，已隐藏；压缩仍会保留它。',
      'summary.textOnly': '压缩摘要只看对话文本',
      'summary.source.all': '压缩摘要来源：全部内容（压缩时自动生成）',
      'summary.source.text': '压缩摘要来源：仅对话文本（工具与上下文不进入摘要）',
      'version.label': 'v{version}',
      'version.mismatch': '宿主 v{host} / 前端 v{client} 不一致：请重启 DSH web 并硬刷新页面。',
      'version.missing': '宿主缺少版本/能力信息：请重启 DSH web 并硬刷新页面。',
      'version.patchOff': '宿主没有注册消息投影：助手/工具/上下文编辑不可用；用户消息仍可编辑。请重启 DSH web 后重试。',
      'version.reload': '重新加载页面',
      'error.state': '读取失败：{error}',
      'error.generic': '操作失败：{error}',
      'error.confirmRequired': '请先阅读并确认不可撤销提示。',
      'error.toolPair': '选中的范围把工具调用和它的结果拆开了；请扩大范围，或把这条消息标为重要。',
      'error.tailLocked': '最后一条消息不能被压缩。',
      'error.systemLocked': '系统消息不能被压缩。',
      'error.rangeTooLarge': '一个压缩块覆盖的消息太多了，请先拆分再压缩。',
      'error.notEditable': '这条消息不可编辑，请刷新后重试。',
      'error.patchUnavailable': '当前宿主不支持就地修改非用户消息，请重启 DSH web 并硬刷新页面。',
      'error.unsupported': '当前宿主不支持这项写入，请升级或重启 DSH web。',
      'error.invalidRange': '压缩范围无效，请刷新后重新选择。',
      'error.sessionNotActive': '这条会话当前没有打开，无法写入。',
      'error.cancelled': '官方压缩已取消，会话没有被修改。',
      'error.compactionSummary': '官方压缩没有生成有效摘要，会话没有被修改。',
      'error.compactionPartial': '官方压缩没有完整写入，请保留备份并检查会话。',
      'error.compactionPersistence': '官方压缩结果没有完整落盘，请检查会话。',
      'error.compactionFailed': '官方压缩失败，会话没有被修改。',
      'misc.user': '用户',
      'misc.assistant': '助手',
      'misc.tool': '工具',
      'misc.context': '上下文',
      'misc.system': '系统',
    }
    const en = {
      'tab.title': 'Context curation',
      'action.open': 'Curate context',
      'action.title': 'Open the context curation workbench (human triage, rewrite, then compress)',
      'panel.title': 'Context curation',
      'panel.subtitle': 'You decide what matters and may rewrite any message. At compression time the model writes the replacement summaries; replaced originals leave the model context.',
      'panel.close': 'Close',
      'panel.loading': 'Reading the session context…',
      'panel.retry': 'Retry',
      'panel.refresh': 'Refresh context',
      'panel.empty': 'This session has no conversation to curate yet.',
      'panel.busy': 'The session is working. Curate after the current turn finishes.',
      'stats.surface': 'Visible ~{tokens} tokens',
      'stats.selected': '{count} segments · {tokens} tokens',
      'stats.after': 'After ~{tokens} tokens',
      'stats.saved': 'Saved {tokens} tokens',
      'scope.title': 'Keep recent',
      'scope.suffix': 'turns verbatim',
      'scope.note': 'The final message is always kept; tool calls and results are never split.',
      'tone.keep': 'Important',
      'tone.normal': 'Normal',
      'tone.minor': 'Minor',
      'tone.keep.hint': 'Keep this range verbatim.',
      'tone.mixed': 'Mixed',
      'segment.keep.note': 'Kept verbatim; not compressed.',
      'segment.range': '#{start}–#{end} · {count} message(s)',
      'segment.hidden': 'Includes {count} hidden tool/context item(s)',
      'tone.normal.hint': 'Summarize with key details at compression time.',
      'tone.minor.hint': 'Summarize hard at compression time; conclusions and errors only.',
      'locked.badge': 'Recent',
      'locked.override': 'Overridden',
      'tail.badge': 'Latest message · always kept',
      'group.range': 'Turn {turn}',
      'group.noTurn': 'Standalone',
      'group.counts': 'user {user} · assistant {assistant} · tool {tool}',
      'group.tokens': '~{tokens} tokens',
      'content.hint': '{count} messages · preview',
      'content.expand': 'Read full text',
      'content.loading': 'Loading full text…',
      'content.collapse': 'Hide full text',
      'content.loaded': 'Full text for {count} messages',
      'content.showMore': 'Show {count} more',
      'content.failed': 'Could not load the full text: {error}',
      'segment.autoSummary': 'A summary is generated automatically at compression time.',
      'group.view.source': 'Source',
      'group.view.rendered': 'Rendered',
      'group.split': 'Split',
      'group.merge': 'Merge next',
      'group.keep.note': 'Kept verbatim; not compressed.',
      'footer.apply': 'Apply to context',
      'footer.cancel': 'Cancel',
      'footer.nothing': 'No block selected for compression.',
      'confirm.title': 'Apply cannot be undone',
      'confirm.body': 'Replacing {count} compressed range(s), {messages} original messages. They stop entering the model context. The originals are backed up on disk, but the session cannot be rolled back.',
      'confirm.keep': '{kept} message(s) marked Important stay verbatim in the same turn.',
      'confirm.backup': 'Backup location: {path}',
      'confirm.check': 'I understand the replaced originals leave the model context and cannot be undone in the session.',
      'confirm.apply': 'Apply',
      'confirm.cancel': 'Keep reviewing',
      'apply.failed': 'Apply failed: {error}',
      'apply.stale': 'The session grew after the workbench opened. Refresh and curate again.',
      'apply.partial': 'Apply stopped partway: {done}/{total} blocks written. Keep the backup and inspect the session.',
      'done.title': 'Context curation applied',
      'done.applied': 'Replaced {count} blocks',
      'done.backup': 'Original backup: {path}',
      'done.check': 'The originals no longer appear in the model context.',
      'done.close': 'Close',
      'toast.select': 'Mark at least one block Normal or Minor first.',
      'toast.noSplit': 'This block cannot be split without breaking a tool-call pair.',
      'toast.saved': 'Draft saved locally.',
      'toast.saveFailed': 'Could not save the draft: browser storage is unavailable or full. Copy anything you need to keep.',
      'toast.mergeLocked': 'The next block is part of the recently kept turns and cannot be merged.',
      'draft.restored': 'Restored the draft you saved earlier; the session has grown since then, so only markings on messages that still exist were kept.',
      'draft.unrestorable': 'None of the messages marked in the saved draft still exist; the draft was kept but cannot be restored.',
      'edit.entry': 'Edit',
      'edit.title.prompt': 'Edit your message',
      'edit.title.reply': 'Edit the reply',
      'edit.save': 'Save edit',
      'edit.cancel': 'Cancel',
      'edit.hint': 'Saved edits are staged; press "Apply to context" at the bottom to write them.',
      'edit.staged': 'Edited (pending)',
      'edit.undo': 'Undo edit',
      'edit.unchanged': 'No change detected.',
      'edit.attachments': 'The {count} attachment(s) on this message are kept as they are.',
      'edit.loading': 'Loading the full message…',
      'edit.failed': 'Could not load it: {error}',
      'edit.readOnly': 'This message cannot be edited.',
      'edit.block': 'Block',
      'edit.block.text': 'Text',
      'edit.block.reasoning': 'Reasoning',
      'edit.noPending': 'No pending edits.',
      'edit.blockSwitch': 'Switching blocks discards your unsaved change.',
      'edit.blockSwitch.confirm': 'Discard and switch',
      'edit.placeholder': 'Type here…',
      'edit.applied': 'Applied {count} edit(s).',
      'edit.unchangedCount': '{count} edit(s) were unchanged.',
      'edit.backup': 'Pre-edit backup: {path}',
      'edit.partial': 'Applied {done}/{total} edits; the rest are still staged.',
      'edit.failedApply': 'Could not apply the edits: {error}',
      'edit.stale': 'The session grew after this workbench opened. Refresh and try again.',
      'edit.busy': 'The session is working. Apply the edits after the current turn finishes.',
      'detail.loadFull': 'Load full text',
      'detail.truncated': 'This text is truncated in the current view.',
      'detail.reasoning': 'Reasoning',
      'detail.toolCall': 'Tool call',
      'detail.toolResult': 'Tool result',
      'detail.attachments': '{count} attachment(s)',
      'detail.patched': 'Rewritten',
      'compress.title': 'Compress context',
      'compress.target': 'Target',
      'compress.method': 'Method',
      'compress.curated': 'Compress the curated blocks',
      'compress.curated.hint': 'Let the model summarize and replace the {count} selected block(s) ({messages} original messages).',
      'compress.curated.unavailable': 'Nothing to compress yet: mark at least one block Normal or Minor.',
      'compress.official': 'Official /compact',
      'compress.official.hint': 'The official compactor picks an older range and replaces it with one summary; it does not follow the blocks above.',
      'compress.official.textOnly': 'The text-only compression-summary switch does not affect official /compact; it still reads the full history.',
      'compress.official.unavailable': 'This host or agent preset provides no official /compact; restart DSH web after upgrading the plugin.',
      'compress.pendingEdits': '{count} edit(s) are not applied yet; apply or undo them before compressing.',
      'compress.confirm': 'Compress',
      'compress.cancel': 'Keep reviewing',
      'compress.doneCurated': 'Compressed {count} curated block(s).',
      'compress.doneOfficial': 'Official /compact replaced {count} history items.',
      'compress.nothing': 'No compactable history yet.',
      'compress.failed': 'Compression failed: {error}',
      'compress.running': 'Compressing…',
      'compress.irreversible': 'I understand the originals leave the model context and cannot be undone in the session.',
      'compress.backup': 'Pre-compression backup: {path}',
      'footer.compress': 'Compress context',
      'footer.applyEdits': 'Apply edits to context',
      'footer.save': 'Save current content',
      'footer.undo': 'Undo',
      'undo.empty': 'Nothing to undo.',
      'undo.done': 'Undid the last change.',
      'panel.help': 'Help',
      'compress.target.direct': 'Compress the current context',
      'compress.target.direct.hint': 'Compress the current context without applying staged edits.',
      'compress.target.direct.pending': 'Direct compression ignores the {count} staged edit(s); they will be cleared after compressing.',
      'compress.target.modified': 'Compress the modified context',
      'compress.target.modified.hint': 'Apply the {count} staged edit(s), then compress the modified content.',
      'compress.target.modified.none': 'No staged edits to apply.',
      'footer.pending': '{count} pending edit(s)',
      'edit.title.tool': 'Edit the tool result',
      'edit.title.context': 'Edit the injected context',
      'edit.toolArgsReadOnly': 'Structured tool-call arguments are not editable.',
      'edit.entryHint': 'Use Edit at the top-right of a message to rewrite text, reasoning, a tool result or injected context.',
      'view.all': 'All content',
      'view.text': 'Dialogue text only',
      'view.hidden': '{count} tool/context item(s) hidden',
      'view.note': 'The view only filters what you see and edit; compression still covers the whole block.',
      'view.empty': 'This block has no dialogue text to show.',
      'tail.hidden': 'The final message is a tool/context item and is hidden here; compression still keeps it.',
      'summary.textOnly': 'Compression summaries: dialogue text only',
      'summary.source.all': 'Compression summary source: all content (generated at compression time)',
      'summary.source.text': 'Compression summary source: dialogue text only (tools and context are omitted)',
      'version.label': 'v{version}',
      'version.mismatch': 'Host v{host} / front-end v{client} differ: restart DSH web and hard-refresh this page.',
      'version.missing': 'The host exposes no version/capability metadata: restart DSH web and hard-refresh this page.',
      'version.patchOff': 'The host registered no message projection: reply/tool/context editing is unavailable; user messages are still editable. Restart DSH web and retry.',
      'version.reload': 'Reload page',
      'error.state': 'Could not load: {error}',
      'error.generic': 'Failed: {error}',
      'error.confirmRequired': 'Read and confirm the irreversible-change notice first.',
      'error.toolPair': 'The selected range splits a tool call from its result; widen the range or mark that message Important.',
      'error.tailLocked': 'The latest message cannot be compressed.',
      'error.systemLocked': 'System messages cannot be compressed.',
      'error.rangeTooLarge': 'This compression block covers too many messages; split it first.',
      'error.notEditable': 'This message cannot be edited; refresh and retry.',
      'error.patchUnavailable': 'This host cannot patch non-user messages in place; restart DSH web and hard-refresh the page.',
      'error.unsupported': 'This host does not support that write; upgrade or restart DSH web.',
      'error.invalidRange': 'That compression range is invalid; refresh and select again.',
      'error.sessionNotActive': 'This session is not open, so nothing can be written.',
      'error.cancelled': 'Official /compact was cancelled; the session is unchanged.',
      'error.compactionSummary': 'Official /compact produced no valid summary; the session is unchanged.',
      'error.compactionPartial': 'Official /compact did not write completely; keep the backup and inspect the session.',
      'error.compactionPersistence': 'Official /compact did not persist completely; inspect the session.',
      'error.compactionFailed': 'Official /compact failed; the session is unchanged.',
      'misc.user': 'User',
      'misc.assistant': 'Assistant',
      'misc.tool': 'Tool',
      'misc.context': 'Context',
      'misc.system': 'System',
    }
    // The host locale service is the source of truth once apply() has run; the
    // browser language is only the fallback for standalone/unit-test renders.
    function hostLocaleId() {
      try {
        if (clientCtx !== null && clientCtx.locale && typeof clientCtx.locale.getLocale === 'function') {
          const snapshot = clientCtx.locale.getLocale()
          if (snapshot && typeof snapshot.active === 'string' && snapshot.active !== '') return snapshot.active
        }
      } catch {}
      return ''
    }
    const isZh = () => {
      try {
        const active = hostLocaleId() || String((typeof navigator !== 'undefined' && navigator.language) || '')
        return active.toLowerCase().startsWith('zh')
      } catch {
        return false
      }
    }
    function tr(key, values) {
      const dict = isZh() ? zh : en
      let text = dict[key] !== undefined ? dict[key] : (zh[key] !== undefined ? zh[key] : key)
      if (values && typeof values === 'object') {
        for (const name of Object.keys(values)) text = text.split(`{${name}}`).join(String(values[name]))
      }
      return text
    }
    function rawErrorMessage(error) {
      return String(error && error.message ? error.message : error)
    }
    /**
     * Translate a host error code into panel copy. Returns null for unknown
     * codes so the caller can fall back to its localized wrapper plus the
     * host's own (Chinese) prose. `context` picks the edit vs compression
     * wording for the two codes that have per-flow strings.
     */
    function hostErrorText(error, context) {
      const code = error && typeof error.code === 'string' ? error.code : ''
      if (code === 'busy') return tr(context === 'edit' ? 'edit.busy' : 'panel.busy')
      if (code === 'stale') return tr(context === 'edit' ? 'edit.stale' : 'apply.stale')
      const keys = {
        'confirm-required': 'error.confirmRequired',
        'tool-pair': 'error.toolPair',
        'tail-locked': 'error.tailLocked',
        'system-locked': 'error.systemLocked',
        'range-too-large': 'error.rangeTooLarge',
        'not-editable': 'error.notEditable',
        'patch-unavailable': 'error.patchUnavailable',
        unsupported: 'error.unsupported',
        cancelled: 'error.cancelled',
        'compaction-summary': 'error.compactionSummary',
        'compaction-partial': 'error.compactionPartial',
        'compaction-persistence': 'error.compactionPersistence',
        'compaction-failed': 'error.compactionFailed',
        'invalid-range': 'error.invalidRange',
        'session-not-active': 'error.sessionNotActive',
      }
      return keys[code] !== undefined ? tr(keys[code]) : null
    }
    // Locale switches must re-render every mounted workbench/header entry.
    const localeListeners = new Set()
    function publishLocaleChange() {
      for (const listener of [...localeListeners]) {
        try {
          listener()
        } catch (error) {
          console.error('[dsh-curate] locale listener failed:', error)
        }
      }
    }
    function useLocaleTick() {
      const [, force] = react.useState(0)
      react.useEffect(() => {
        const listener = () => force((value) => value + 1)
        localeListeners.add(listener)
        return () => localeListeners.delete(listener)
      }, [])
    }
    function fmtTokens(tokens) {
      const value = Number.isFinite(tokens) ? Math.max(0, Math.round(tokens)) : 0
      if (value >= 1000) return `${(value / 1000).toFixed(value >= 10_000 ? 0 : 1)}k`
      return String(value)
    }

    // --- per-message tones and compression segments -------------------------

    /**
     * Rough size of the summary the model will write at compression time. The
     * target is a share of the original range (see the host's tone prompt):
     * about 12% for Normal and 5% for Minor, with a small floor.
     */
    function estimatedSummaryTokens(segment) {
      const tokens = segment && Number.isFinite(segment.tokens) ? Math.max(0, segment.tokens) : 0
      const ratio = segment && segment.tone === 'minor' ? 0.05 : 0.12
      return Math.max(120, Math.round(tokens * ratio))
    }

    /**
     * Union tool calls with their results. One assistant message can announce
     * several calls; every matching result joins the same unit. A tone applies
     * to the whole unit so a compression segment can never split a call/result
     * pair.
     */
    function buildToneUnits(nodes) {
      const parent = nodes.map((_, index) => index)
      function find(index) {
        let root = index
        while (parent[root] !== root) root = parent[root]
        let current = index
        while (parent[current] !== current) {
          const next = parent[current]
          parent[current] = root
          current = next
        }
        return root
      }
      function union(left, right) {
        const a = find(left)
        const b = find(right)
        if (a !== b) parent[b] = a
      }
      const resultByCall = new Map()
      nodes.forEach((node, index) => {
        if (node && node.role === 'tool' && typeof node.toolResultFor === 'string' && node.toolResultFor !== '') {
          resultByCall.set(node.toolResultFor, index)
        }
      })
      nodes.forEach((node, index) => {
        if (!node || !Array.isArray(node.toolCallIds)) return
        for (const id of node.toolCallIds) {
          if (typeof id !== 'string' || id === '') continue
          const result = resultByCall.get(id)
          if (result !== undefined) union(index, result)
        }
      })
      return {
        find,
        unitOf(index) {
          const root = find(index)
          const out = []
          for (let cursor = 0; cursor < nodes.length; cursor += 1) {
            if (find(cursor) === root) out.push(cursor)
          }
          return out
        },
      }
    }

    /**
     * Split one group into contiguous compression segments by effective tone.
     * Tool units are normalized to one tone first (keep > normal > minor), so a
     * segment boundary always falls outside a call/result pair.
     */
    function segmentsForGroup(group, surface, toneAt, units) {
      const start = group.startIndex
      const end = group.endIndex
      if (start === undefined || end === undefined || end < start) return []
      const tones = []
      for (let index = start; index <= end; index += 1) tones.push(toneAt(index))
      if (units) {
        const byRoot = new Map()
        for (let index = start; index <= end; index += 1) {
          const root = units.find(index)
          if (!byRoot.has(root)) byRoot.set(root, [])
          byRoot.get(root).push(index)
        }
        const rank = { keep: 3, normal: 2, minor: 1 }
        for (const [root, indices] of byRoot) {
          // A tone unit that is only partially inside this group cannot be
          // compressed here: its other members (usually the tool result just
          // after the group, or a call before it) would be split off. Mirror
          // the host's validatePlan and keep the whole in-group part verbatim.
          const whole = units.unitOf(root)
          if (whole.length !== indices.length) {
            for (const index of indices) tones[index - start] = 'keep'
            continue
          }
          if (indices.length < 2) continue
          let best = tones[indices[0] - start]
          for (const index of indices) {
            if ((rank[tones[index - start]] || 0) > (rank[best] || 0)) best = tones[index - start]
          }
          for (const index of indices) tones[index - start] = best
        }
      }
      const segments = []
      let current = null
      for (let index = start; index <= end; index += 1) {
        const tone = tones[index - start]
        if (current === null || tone !== current.tone) {
          if (current !== null) segments.push(current)
          current = { tone, startIndex: index, endIndex: index, startSeq: surface[index] ? surface[index].seq : null, endSeq: null }
        }
        current.endIndex = index
        current.endSeq = surface[index] ? surface[index].seq : null
      }
      if (current !== null) segments.push(current)
      for (const segment of segments) {
        const nodes = surface.slice(segment.startIndex, segment.endIndex + 1)
        segment.key = `${segment.startSeq}-${segment.endSeq}-${segment.tone}`
        segment.count = nodes.length
        segment.tokens = nodes.reduce((sum, node) => sum + (Number.isFinite(node.tokens) ? node.tokens : 0), 0)
      }
      return segments
    }

    /** The single tone of a group, or 'mixed' when its messages disagree. */
    function groupToneOf(segments) {
      if (segments.length === 0) return 'normal'
      const first = segments[0].tone
      return segments.every((segment) => segment.tone === first) ? first : 'mixed'
    }

    /** Stable key for one staged edit. */
    function editKeyFor(mode, seq, blockIndex) {
      return mode === 'prompt' ? `p:${seq}` : `${mode}:${seq}:${blockIndex}`
    }

    // --- Markdown vendor helpers (same converters as dsh-edit-turn's panel) ---

    function vendo() {
      try {
        return typeof __DSHCURATE_VENDOR__ === 'object' && __DSHCURATE_VENDOR__ !== null ? __DSHCURATE_VENDOR__ : null
      } catch {
        return null
      }
    }
    function escapeHtmlText(value) {
      return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
    }
    function escapeMarkdownParagraph(text) {
      return '<p>' + escapeHtmlText(text).replace(/\n/g, '<br>') + '</p>'
    }
    /**
     * Sanitize already-parsed Markdown HTML. Without DOMPurify we must not
     * return the raw `marked` output (it may contain script/event attributes),
     * so fall back to an escaped text paragraph instead.
     */
    function sanitizeMarkdownHtml(raw, source, vendor) {
      if (vendor && vendor.DOMPurify !== undefined && typeof vendor.DOMPurify.sanitize === 'function') {
        return vendor.DOMPurify.sanitize(raw, {
          USE_PROFILES: { html: true },
          FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'form', 'textarea'],
          FORBID_ATTR: ['style'],
        })
      }
      return escapeMarkdownParagraph(source)
    }
    function markdownToHtml(source) {
      const text = typeof source === 'string' ? source : ''
      const vendor = vendo()
      if (vendor === null || typeof vendor.marked === 'undefined') return escapeMarkdownParagraph(text)
      try {
        return sanitizeMarkdownHtml(vendor.marked.parse(text), text, vendor)
      } catch {
        return escapeMarkdownParagraph(text)
      }
    }
    function htmlToMarkdown(html) {
      const vendor = vendo()
      const source = typeof html === 'string' ? html : ''
      if (vendor === null || typeof vendor.turndown === 'undefined') return source.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')
      try {
        return vendor.turndown.turndown(source).replace(/\n+$/, '')
      } catch {
        return source.replace(/<[^>]+>/g, '')
      }
    }
    function isAbsoluteMediaPath(value) {
      return typeof value === 'string' && (value.startsWith('/') || /^[A-Za-z]:[\\/]/.test(value))
    }
    function resolveWorkspacePath(cwd, value) {
      const path = typeof value === 'string' ? value : ''
      if (path === '' || isAbsoluteMediaPath(path)) return path
      if (typeof cwd !== 'string' || cwd === '') return path
      const absolute = cwd.startsWith('/') || /^[A-Za-z]:[\\/]/.test(cwd)
      const combined = cwd.replace(/[\\/]+$/, '') + '/' + path.replace(/\\/g, '/')
      const out = []
      for (const part of combined.split('/')) {
        if (part === '' || part === '.') continue
        if (part === '..') {
          if (out.length > 0 && out[out.length - 1] !== '..') out.pop()
          else if (!absolute) out.push('..')
          continue
        }
        out.push(part)
      }
      let normalized = out.join('/')
      if (absolute) normalized = '/' + normalized
      return normalized === '' ? path : normalized
    }
    function fileMediaUrl(path) {
      if (typeof path !== 'string' || path === '') return null
      try {
        const base = typeof document !== 'undefined' ? document.baseURI : ''
        if (!/^https?:/i.test(base) && !base.startsWith('dsh-app://app/')) return null
        return new URL(`api/file?path=${encodeURIComponent(path)}`, base).href
      } catch {
        return null
      }
    }
    function resolveRenderedImages(container, cwd) {
      if (!container || typeof container.querySelectorAll !== 'function') return
      let images = []
      try {
        images = container.querySelectorAll('img')
      } catch {
        return
      }
      for (const image of images) {
        let raw = ''
        try {
          raw = image.getAttribute('src') || ''
        } catch {
          raw = ''
        }
        if (raw === '' || /^(?:[a-z][a-z0-9+.-]*:)/i.test(raw)) continue
        let decoded = raw
        try {
          decoded = decodeURIComponent(raw.split(/[?#]/u)[0] || '')
        } catch {
          decoded = raw
        }
        if (decoded === '') continue
        const url = fileMediaUrl(resolveWorkspacePath(cwd, decoded))
        if (url !== null) {
          try {
            image.setAttribute('src', url)
          } catch {}
        }
      }
    }

    // --- workbench open state per Session ------------------------------------

    const workbenches = new Map()
    function workbenchFor(sessionId) {
      let workbench = workbenches.get(sessionId)
      if (workbench === undefined) {
        workbench = { open: false, listeners: new Set() }
        workbenches.set(sessionId, workbench)
      }
      return workbench
    }
    function notifyWorkbench(workbench) {
      for (const listener of [...workbench.listeners]) {
        try {
          listener()
        } catch (error) {
          console.error('[dsh-curate] workbench listener failed:', error)
        }
      }
    }
    function openWorkbench(sessionId) {
      const workbench = workbenchFor(sessionId)
      workbench.open = true
      notifyWorkbench(workbench)
    }
    function closeWorkbench(sessionId) {
      const workbench = workbenchFor(sessionId)
      workbench.open = false
      notifyWorkbench(workbench)
    }
    // --- right Sidebar tab ----------------------------------------------------

    // The approved UI seat: the workbench lives in the official right Sidebar as
    // its own tab type. The overlay registered below stays as a fallback for a
    // composition without the Sidebar services.
    let openCurateTab = null
    let closeCurateTab = null
    // Set once by apply(): the workbench uses the client `sessions` service to
    // resync the transcript after it writes to the session.
    let clientCtx = null

    function dockedCloseTab() {
      if (closeCurateTab !== null) {
        try {
          closeCurateTab()
          return
        } catch (error) {
          console.error('[dsh-curate] closing the curation tab failed:', error)
        }
      }
    }

    function useWorkbenchState(sessionId) {
      const workbench = workbenchFor(sessionId)
      const [, force] = react.useState(0)
      react.useEffect(() => {
        const listener = () => force((value) => value + 1)
        workbench.listeners.add(listener)
        return () => workbench.listeners.delete(listener)
      }, [sessionId])
      return workbench
    }

    // --- host API ------------------------------------------------------------

    async function request(path, options) {
      const response = await fetch(`${ROUTE_PREFIX}${path}`, {
        headers: { 'content-type': 'application/json' },
        ...options,
      })
      let data = {}
      try {
        data = await response.json()
      } catch {
        data = {}
      }
      if (!response.ok || data.ok === false) {
        const error = new Error(typeof data.error === 'string' ? data.error : `HTTP ${response.status}`)
        error.status = response.status
        error.code = data.code || 'http'
        error.payload = data
        throw error
      }
      return data
    }
    async function loadState(sessionId, signal) {
      // The caller may abort a superseded load (see Workbench.load).
      return request(`/state?sessionId=${encodeURIComponent(sessionId)}`, signal ? { signal } : undefined)
    }
    async function loadContent(sessionId, startSeq, endSeq) {
      return request(`/content?sessionId=${encodeURIComponent(sessionId)}&startSeq=${startSeq}&endSeq=${endSeq}`)
    }
    async function applyPlan(sessionId, expectedLastSeq, ops, label, options = {}) {
      return request('/apply', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          expectedLastSeq,
          confirm: true,
          ops,
          label,
          autoSummarize: options.autoSummarize === true,
          textOnly: options.textOnly === true,
        }),
      })
    }
    /**
     * Compatibility path for a host older than 0.4.1: it has no auto-summary in
     * /apply, but still exposes /summarize. The 0.4.1 client falls back to it
     * when the host rejects a text-less plan, so curated compression keeps
     * working until the host is restarted.
     */
    async function draftSummaryLegacy(sessionId, segment, textOnly) {
      return request('/summarize', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          startSeq: segment.startSeq,
          endSeq: segment.endSeq,
          tone: segment.tone,
          textOnly: textOnly === true,
        }),
      })
    }
    async function loadMessage(sessionId, seq) {
      return request(`/message?sessionId=${encodeURIComponent(sessionId)}&seq=${encodeURIComponent(String(seq))}`)
    }
    async function applyMessageEdits(sessionId, expectedLastSeq, edits) {
      return request('/edit', {
        method: 'POST',
        body: JSON.stringify({ sessionId, expectedLastSeq, confirm: true, edits }),
      })
    }
    async function compactContext(sessionId, expectedLastSeq) {
      return request('/compact', {
        method: 'POST',
        body: JSON.stringify({ sessionId, expectedLastSeq, confirm: true }),
      })
    }

    /** Best-effort refresh of the host transcript after this workbench writes. */
    function resyncConversation(sessionId) {
      try {
        const sessions = clientCtx && typeof clientCtx.get === 'function' ? clientCtx.get('sessions') : null
        const binding = sessions && typeof sessions.binding === 'function' ? sessions.binding(sessionId) : undefined
        const session = binding && binding.session
        if (session && typeof session.resync === 'function') session.resync()
      } catch (error) {
        console.error('[dsh-curate] session resync failed:', error)
      }
    }

    // --- grouping ------------------------------------------------------------

    function middleCut(surface, start, end) {
      const candidates = []
      for (let index = start; index < end; index += 1) {
        const current = surface[index]
        const next = surface[index + 1]
        if (!current || !next) continue
        if (current.role === 'tool') {
          if (next.role !== 'tool') candidates.push(index)
          continue
        }
        if (next.role === 'user') {
          candidates.push(index)
          continue
        }
        if (current.role === 'assistant' && Array.isArray(current.toolCalls) && current.toolCalls.length === 0) candidates.push(index)
      }
      if (candidates.length === 0) return null
      const middle = (start + end) / 2
      let best = candidates[0]
      for (const candidate of candidates) if (Math.abs(candidate - middle) < Math.abs(best - middle)) best = candidate
      return best
    }

    function buildGroups(state, preserveTurns) {
      const all = Array.isArray(state.nodes) ? state.nodes : []
      const surface = all.filter((node) => node && node.role !== 'system')
      if (surface.length === 0) return { surface, groups: [] }
      const selectable = surface.slice(0, Math.max(0, surface.length - 1))
      const groups = []
      let current = null
      for (let index = 0; index < selectable.length; index += 1) {
        const node = selectable[index]
        const turn = typeof node.turn === 'number' ? node.turn : null
        if (current !== null && turn !== null && current.turn !== null && turn !== current.turn) {
          groups.push(current)
          current = null
        }
        if (current === null) current = { startIndex: index, endIndex: index, turn }
        current.endIndex = index
      }
      if (current !== null) groups.push(current)
      const turns = [...new Set(surface.map((node) => node.turn).filter((turn) => typeof turn === 'number'))].sort((a, b) => b - a)
      const lockedTurns = new Set(turns.slice(0, Math.max(0, preserveTurns)))
      return {
        surface,
        groups: groups.map((group) => ({
          id: `${surface[group.startIndex].seq}-${surface[group.endIndex].seq}`,
          startIndex: group.startIndex,
          endIndex: group.endIndex,
          turn: group.turn,
          tone: lockedTurns.has(group.turn) ? 'keep' : 'normal',
          locked: lockedTurns.has(group.turn),
        })),
      }
    }

    /** Clamp a persisted "keep recent turns" scope to the select's 0..6 options. */
    function normalizePreserveTurns(value) {
      return Number.isInteger(value) && value >= 0 && value <= PRESERVE_TURNS_MAX ? value : null
    }
    function readDraft(sessionId) {
      try {
        const raw = localStorage.getItem(DRAFT_PREFIX + sessionId)
        return raw ? JSON.parse(raw) : null
      } catch (error) {
        // Corrupt JSON and blocked/quota-denied storage both land here; the
        // panel still loads, but the caller must not pretend a draft exists.
        try {
          console.warn('[dsh-curate] could not read the saved draft:', error)
        } catch {}
        return null
      }
    }
    /** Returns true only when the browser accepted the write. */
    function writeDraft(sessionId, payload) {
      try {
        localStorage.setItem(DRAFT_PREFIX + sessionId, JSON.stringify(payload))
        return true
      } catch (error) {
        try {
          console.warn('[dsh-curate] could not write the draft:', error)
        } catch {}
        return false
      }
    }
    function clearDraft(sessionId) {
      try {
        localStorage.removeItem(DRAFT_PREFIX + sessionId)
        return true
      } catch (error) {
        try {
          console.warn('[dsh-curate] could not clear the draft:', error)
        } catch {}
        return false
      }
    }
    /** A payload is "empty" when no tone or staged edit survived in it. */
    function draftHasContent(payload) {
      if (!payload || typeof payload !== 'object') return false
      const tones = Array.isArray(payload.tones) ? payload.tones.length : 0
      const edits = Array.isArray(payload.edits) ? payload.edits.length : 0
      return tones > 0 || edits > 0
    }

    // --- styles --------------------------------------------------------------

    /** Inject the stylesheet once and return a disposer that removes it. */
    function ensureStyles() {
      const noop = () => {}
      if (typeof document === 'undefined') return noop
      // A previous plugin instance (or an HMR reload) owns the existing node.
      if (document.getElementById(STYLE_ID)) return noop
      const style = document.createElement('style')
      style.id = STYLE_ID
      style.textContent = `
        .dshcurate-open{display:inline-flex;align-items:center;gap:4px;height:26px;padding:0 9px;border:1px solid var(--dsw-alias-border-l2, #d9d9d9);border-radius:6px;background:transparent;color:var(--dsw-alias-label-primary, #222);font-size:12px;line-height:1;cursor:pointer;white-space:nowrap}
        .dshcurate-open:hover{background:var(--dsw-alias-interactive-bg-hover, #f5f5f5)}
        .dshcurate-layer{position:fixed;inset:0;z-index:70;display:flex;align-items:center;justify-content:center;padding:20px;background:var(--dsw-alias-bg-mask-1,rgba(0,0,0,.38))}
        .dshcurate-panel{width:min(1180px,96vw);height:92vh;display:flex;flex-direction:column;overflow:hidden;border:1px solid var(--dsw-alias-border-l2,#ddd);border-radius:12px;background:var(--dsw-alias-bg-layer-1, #fff);color:var(--dsw-alias-label-primary,#222);box-shadow:0 18px 48px rgba(0,0,0,.22);font-size:13px}
        .dshcurate-head{display:flex;align-items:flex-start;gap:12px;padding:12px 16px 10px;border-bottom:1px solid var(--dsw-alias-border-l2,#e8e8e8)}
        .dshcurate-head-main{flex:1;min-width:0}
        .dshcurate-title{margin:0;font-size:15px;font-weight:600;line-height:1.4}
        .dshcurate-subtitle{margin:2px 0 0;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-tertiary,#777)}
        .dshcurate-title-row{display:flex;align-items:center;gap:7px;min-width:0}
        .dshcurate-help{flex:none;width:20px;height:20px;padding:0;border:1px solid var(--dsw-alias-border-l2,#d9d9d9);border-radius:50%;background:transparent;color:var(--dsw-alias-label-tertiary,#777);font-size:12px;line-height:18px;cursor:pointer}
        .dshcurate-help:hover{background:var(--dsw-alias-interactive-bg-hover,#f5f5f5);color:var(--dsw-alias-label-primary,#222)}
        .dshcurate-help-pop{margin:0 16px 10px;padding:9px 11px;border:1px solid var(--dsw-alias-border-l2,#ddd);border-radius:8px;background:var(--dsw-alias-interactive-bg-hover,#fafafa);font-size:12px;line-height:1.6;color:var(--dsw-alias-label-secondary,#555)}
        .dshcurate-help-pop p{margin:0 0 4px}
        .dshcurate-help-pop p:last-child{margin-bottom:0}
        .dshcurate-icon{flex:none;width:28px;height:28px;border:1px solid var(--dsw-alias-border-l2,#ddd);border-radius:6px;background:transparent;color:inherit;font-size:16px;line-height:1;cursor:pointer}
        .dshcurate-icon:hover{background:var(--dsw-alias-interactive-bg-hover,#f5f5f5)}
        .dshcurate-stats{display:flex;flex-wrap:nowrap;align-items:center;gap:14px;overflow-x:auto;white-space:nowrap;padding:8px 16px;border-bottom:1px solid var(--dsw-alias-border-l2,#f0f0f0);font-size:11.5px;color:var(--dsw-alias-label-secondary,#555)}
        .dshcurate-stats b{font-weight:600;color:var(--dsw-alias-label-primary,#222)}
        .dshcurate-scope{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:8px 16px;border-bottom:1px solid var(--dsw-alias-border-l2,#f0f0f0);font-size:12px;color:var(--dsw-alias-label-secondary,#555)}
        .dshcurate-scope select{height:26px;padding:0 6px;border:1px solid var(--dsw-alias-border-l2,#d9d9d9);border-radius:6px;background:var(--dsw-alias-bg-layer-1,#fff);color:inherit;font-size:12px}
        .dshcurate-body{flex:1;min-height:0;overflow:auto;padding:12px 16px}
        .dshcurate-alert{margin:0 0 10px;padding:8px 10px;border:1px solid rgba(220,90,90,.38);border-radius:8px;background:rgba(220,90,90,.10);color:var(--dsw-alias-state-error-primary,#c0504d);font-size:12px;line-height:1.5}
        .dshcurate-card{margin:0 0 10px;border:1px solid var(--dsw-alias-border-l2,#e6e6e6);border-radius:9px;padding:9px 11px;background:var(--dsw-alias-bg-layer-1,#fff)}
        .dshcurate-card.locked{background:var(--dsw-alias-interactive-bg-hover,#fafafa)}
        .dshcurate-snippets-wrap{margin:6px 0 2px}
        .dshcurate-snippets{max-height:230px;overflow:auto;padding:2px 4px;border:1px solid var(--dsw-alias-border-l1,#484848);border-radius:7px;background:var(--dsw-alias-bg-layer-1,#0a0a0a)}
        .dshcurate-snippet{display:flex;align-items:flex-start;gap:6px;padding:4px 5px;border-bottom:1px solid var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.15));font-size:11.5px;line-height:1.55}
        .dshcurate-snippet:last-child{border-bottom:0}
        .dshcurate-role{flex:none;min-width:32px;padding:0 5px;border-radius:4px;background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.14));color:var(--dsw-alias-label-secondary,#666);font-size:10.5px;line-height:17px;text-align:center}
        .dshcurate-role.assistant{color:var(--dsw-alias-brand-primary,#4c6ef5)}
        .dshcurate-role.tool,.dshcurate-role.context{color:var(--dsw-alias-label-tertiary,#777)}
        .dshcurate-snippet-seq{flex:none;color:var(--dsw-alias-label-tertiary,#777);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:10.5px;line-height:17px}
        .dshcurate-snippet-text{flex:1;min-width:0;white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;color:var(--dsw-alias-label-secondary,#555)}
        .dshcurate-snippets.full .dshcurate-snippet-text{display:block;-webkit-line-clamp:unset;max-height:180px;overflow:auto;color:var(--dsw-alias-label-primary,#222)}
        .dshcurate-snippet.error .dshcurate-snippet-text{color:var(--dsw-alias-state-error-primary,#c0504d)}
        .dshcurate-snippet-tools{display:flex;align-items:center;gap:8px;margin-top:4px}
        .dshcurate-snippet-tools .muted{flex:1;min-width:0;font-size:11px;color:var(--dsw-alias-label-tertiary,#777)}
        .dshcurate-card-head{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px}
        .dshcurate-card-meta{flex:1;min-width:220px;font-size:12px;color:var(--dsw-alias-label-tertiary,#777);line-height:1.5}
        .dshcurate-card-meta b{color:var(--dsw-alias-label-primary,#222);font-weight:600}
        .dshcurate-badge{display:inline-block;margin-left:6px;padding:0 6px;border-radius:10px;background:var(--dsw-alias-interactive-bg-hover,#eee);font-size:11px;line-height:18px;color:var(--dsw-alias-label-tertiary,#666)}
        .dshcurate-tones{display:inline-flex;gap:2px;padding:2px;border:1px solid var(--dsw-alias-border-l2,#ddd);border-radius:7px}
        .dshcurate-tone{height:22px;padding:0 8px;border:0;border-radius:5px;background:transparent;color:var(--dsw-alias-label-tertiary,#666);font-size:11.5px;line-height:1;cursor:pointer}
        .dshcurate-tone.active{background:var(--dsw-alias-button-ghost-active-fill,var(--dsw-alias-interactive-bg-hover,#eee));color:var(--dsw-alias-label-primary,#222)}
        .dshcurate-tone:disabled{opacity:.55;cursor:default}
        .dshcurate-tools{display:flex;flex-wrap:wrap;gap:6px;margin-top:7px}
        .dshcurate-btn{height:26px;padding:0 10px;border:1px solid var(--dsw-alias-border-l2,#d9d9d9);border-radius:6px;background:transparent;color:inherit;font-size:12px;line-height:1;cursor:pointer;white-space:nowrap}
        .dshcurate-btn:hover{background:var(--dsw-alias-interactive-bg-hover,#f5f5f5)}
        .dshcurate-btn:disabled{opacity:.5;cursor:default}
        .dshcurate-btn.primary{border-color:transparent;background:var(--dsw-alias-button-primary-fill,var(--dsw-alias-brand-primary,#4c6ef5));color:var(--dsw-alias-label-primary-foreground,#fff)}
        .dshcurate-btn.primary:hover{opacity:.9;background:var(--dsw-alias-brand-primary,#4c6ef5)}
        .dshcurate-btn.danger{border-color:rgba(220,90,90,.45);color:var(--dsw-alias-state-error-primary,#c0504d)}
        .dshcurate-btn.small{height:22px;padding:0 8px;font-size:11.5px}
        .dshcurate-hint{display:flex;gap:6px;margin-top:8px}
        .dshcurate-hint input{flex:1;min-width:0;height:26px;padding:0 8px;border:1px solid var(--dsw-alias-border-l2,#ddd);border-radius:6px;background:var(--dsw-alias-bg-layer-1,#fff);color:inherit;font-size:12px}
        .dshcurate-note{margin-top:8px;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-tertiary,#777)}
        .dshcurate-modes{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:8px 0 4px;font-size:12px;color:var(--dsw-alias-label-tertiary,#777)}
        .dshcurate-modes .group{display:inline-flex;gap:2px;padding:2px;border:1px solid var(--dsw-alias-border-l2,#ddd);border-radius:7px}
        .dshcurate-modes button{height:22px;padding:0 8px;border:0;border-radius:5px;background:transparent;color:inherit;font-size:11.5px;line-height:1;cursor:pointer}
        .dshcurate-modes button.active{background:var(--dsw-alias-button-ghost-active-fill,var(--dsw-alias-interactive-bg-hover,#eee));color:var(--dsw-alias-label-primary,#222)}
        .dshcurate-source{display:block;width:100%;box-sizing:border-box;min-height:110px;max-height:320px;padding:8px 10px;border:1px solid var(--dsw-alias-border-l2,#ddd);border-radius:8px;background:var(--dsw-alias-bg-layer-1,#fff);color:inherit;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12.5px;line-height:1.6;resize:vertical}
        .dshcurate-rendered{box-sizing:border-box;width:100%;min-height:110px;max-height:320px;overflow:auto;padding:8px 10px;border:1px solid var(--dsw-alias-border-l2,#ddd);border-radius:8px;background:var(--dsw-alias-bg-layer-1,#fff);font-size:13px;line-height:1.65;outline:none;cursor:text}
        .dshcurate-rendered:focus{border-color:var(--dsw-alias-brand-primary,#4c6ef5);box-shadow:0 0 0 2px rgba(76,110,245,.16)}
        .dshcurate-rendered:empty:before{content:attr(data-placeholder);color:var(--dsw-alias-label-tertiary,#aaa)}
        .dshcurate-md h1,.dshcurate-md h2,.dshcurate-md h3{font-size:15px;margin:10px 0 6px;line-height:1.4}
        .dshcurate-md h1{font-size:17px}
        .dshcurate-md p{margin:6px 0}
        .dshcurate-md ul,.dshcurate-md ol{margin:6px 0;padding-left:22px}
        .dshcurate-md li{margin:2px 0}
        .dshcurate-md code{padding:1px 4px;border-radius:4px;background:var(--dsw-alias-interactive-bg-hover,#f2f2f2);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px}
        .dshcurate-md pre{margin:8px 0;padding:8px 10px;border-radius:7px;background:var(--dsw-alias-interactive-bg-hover,#f6f6f6);overflow:auto}
        .dshcurate-md pre code{padding:0;background:transparent}
        .dshcurate-md blockquote{margin:6px 0;padding:2px 10px;border-left:3px solid var(--dsw-alias-border-l2,#ddd);color:var(--dsw-alias-label-secondary,#555)}
        .dshcurate-md img{max-width:100%;height:auto;border-radius:6px}
        .dshcurate-md table{border-collapse:collapse;margin:6px 0;font-size:12px}
        .dshcurate-md th,.dshcurate-md td{border:1px solid var(--dsw-alias-border-l2,#ddd);padding:3px 6px}
        .dshcurate-err{margin:6px 0 0;font-size:12px;line-height:1.5;color:var(--dsw-alias-state-error-primary,#c0504d)}
        .dshcurate-empty{padding:48px 16px;text-align:center;font-size:13px;color:var(--dsw-alias-label-tertiary,#777)}
        .dshcurate-foot{display:flex;flex-wrap:wrap;align-items:center;gap:8px;justify-content:flex-start;padding:10px 16px;border-top:1px solid var(--dsw-alias-border-l2,#e8e8e8)}
        .dshcurate-foot .spacer{flex:1}
        .dshcurate-foot .note{font-size:12px;color:var(--dsw-alias-label-tertiary,#777)}
        .dshcurate-confirm{margin:0 0 10px;padding:10px 12px;border:1px solid #e0b4b4;border-radius:8px;background:#fff8f8;color:#7a2b2b}
        .dshcurate-confirm h4{margin:0 0 6px;font-size:13px}
        .dshcurate-confirm p{margin:0 0 6px;font-size:12px;line-height:1.55}
        .dshcurate-confirm label{display:flex;gap:6px;align-items:flex-start;font-size:12px;line-height:1.5;margin:8px 0}
        .dshcurate-confirm .row{display:flex;gap:8px;justify-content:flex-end}
        .dshcurate-toast{position:sticky;bottom:0;margin:8px 0 0;padding:6px 10px;border-radius:7px;background:var(--dsw-alias-interactive-bg-hover,#f2f2f2);font-size:12px;color:var(--dsw-alias-label-secondary,#555)}
        @media (max-width:720px){.dshcurate-panel{width:100vw;height:100vh;border-radius:0}.dshcurate-layer{padding:0}}
        .dshcurate-dock{width:100%;height:100%;min-height:0;display:flex;flex-direction:column;background:var(--dsw-alias-bg-base,#fff);color:var(--dsw-alias-label-primary,#222)}
        .dshcurate-dock .dshcurate-panel{width:100%;height:100%;border:0;border-radius:0;box-shadow:none;background:transparent}
        .dshcurate-banner{margin:0 0 10px;padding:8px 10px;border:1px solid var(--dsw-alias-border-l2,#ddd);border-radius:8px;background:var(--dsw-alias-interactive-bg-hover,#f5f5f5);font-size:12px;line-height:1.55;color:var(--dsw-alias-label-secondary,#555)}
        .dshcurate-banner b{color:var(--dsw-alias-label-primary,#222)}
        .dshcurate-banner .path{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;word-break:break-all}
        .dshcurate-detail{margin:6px 0 0}
        .dshcurate-detail-list{display:flex;flex-direction:column;gap:8px;max-height:460px;overflow:auto;padding:2px}
        .dshcurate-message{border:1px solid var(--dsw-alias-border-l2,#e6e6e6);border-radius:8px;padding:7px 9px;background:var(--dsw-alias-bg-layer-1,#fff)}
        .dshcurate-message.staged{border-color:var(--dsw-alias-brand-primary,#4c6ef5)}
        .dshcurate-message-head{display:flex;flex-wrap:wrap;align-items:center;gap:5px 8px;font-size:11.5px;color:var(--dsw-alias-label-tertiary,#777)}
        .dshcurate-message-head .seq{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:10.5px}
        .dshcurate-message-head .spring{flex:1}
        .dshcurate-message-body{margin-top:5px;font-size:12.5px;line-height:1.6;color:var(--dsw-alias-label-primary,#222)}
        .dshcurate-message-body .dshcurate-md{font-size:12.5px;line-height:1.6}
        .dshcurate-badge.edit{background:rgba(76,110,245,.14);color:var(--dsw-alias-brand-primary,#4c6ef5)}
        .dshcurate-badge.stale{background:rgba(180,120,20,.16);color:#9a6a12}
        .dshcurate-tool-text{margin:4px 0;padding:6px 8px;border-radius:6px;background:var(--dsw-alias-interactive-bg-hover,#f5f5f5);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;line-height:1.55;white-space:pre-wrap;word-break:break-word;max-height:170px;overflow:auto}
        .dshcurate-tool-text.error{color:var(--dsw-alias-state-error-primary,#c0504d)}
        .dshcurate-reasoning{margin:5px 0;padding:5px 8px;border-left:2px solid var(--dsw-alias-border-l2,#ddd);font-size:11.5px;line-height:1.55;color:var(--dsw-alias-label-secondary,#555);background:var(--dsw-alias-interactive-bg-hover,#fafafa);border-radius:0 6px 6px 0}
        .dshcurate-reasoning summary{cursor:pointer;color:var(--dsw-alias-label-tertiary,#777)}
        .dshcurate-reasoning pre{margin:5px 0 0;white-space:pre-wrap;word-break:break-word;font-family:inherit;font-size:11.5px}
        .dshcurate-block-chip{display:inline-flex;align-items:center;gap:4px;margin:2px 4px 2px 0;padding:1px 6px;border-radius:5px;background:var(--dsw-alias-interactive-bg-hover,#eee);font-size:10.5px;color:var(--dsw-alias-label-secondary,#666)}
        .dshcurate-editor{margin:6px 0 2px;padding:8px;border:1px solid var(--dsw-alias-border-l2,#ddd);border-radius:8px;background:var(--dsw-alias-bg-base,#fff)}
        .dshcurate-editor-head{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;font-size:11.5px;color:var(--dsw-alias-label-tertiary,#777)}
        .dshcurate-editor-head .grow{flex:1}
        .dshcurate-editor-head select{height:24px;padding:0 6px;border:1px solid var(--dsw-alias-border-l2,#ddd);border-radius:6px;background:var(--dsw-alias-bg-layer-1,#fff);color:inherit;font-size:11.5px}
        .dshcurate-editor .dshcurate-modes{margin-top:6px}
        .dshcurate-editor .dshcurate-source,.dshcurate-editor .dshcurate-rendered{min-height:150px;max-height:440px}
        .dshcurate-editor-foot{display:flex;flex-wrap:wrap;align-items:center;gap:8px;justify-content:flex-end;margin-top:6px}
        .dshcurate-editor-foot .hint{flex:1;min-width:180px;font-size:11px;line-height:1.5;color:var(--dsw-alias-label-tertiary,#777)}
        .dshcurate-compress{margin:0 0 10px;padding:10px 12px;border:1px solid var(--dsw-alias-border-l2,#ddd);border-radius:9px;background:var(--dsw-alias-bg-layer-1,#fff)}
        .dshcurate-compress h4{margin:0 0 6px;font-size:13px}
        .dshcurate-option{display:flex;gap:8px;align-items:flex-start;margin:6px 0;padding:7px 9px;border:1px solid var(--dsw-alias-border-l2,#ddd);border-radius:7px;cursor:pointer}
        .dshcurate-option.active{border-color:var(--dsw-alias-brand-primary,#4c6ef5);background:rgba(76,110,245,.10)}
        .dshcurate-option.disabled{opacity:.55;cursor:default}
        .dshcurate-option input{margin-top:2px}
        .dshcurate-option .t{font-size:12.5px;font-weight:600}
        .dshcurate-option .d{margin-top:1px;font-size:11.5px;line-height:1.5;color:var(--dsw-alias-label-tertiary,#777)}
        .dshcurate-compress > label{display:flex;gap:6px;align-items:flex-start;margin:8px 0;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-secondary,#555)}
        .dshcurate-compress-group{margin:0 0 8px}
        .dshcurate-compress-label{margin:0 0 4px;font-size:11px;color:var(--dsw-alias-label-tertiary,#777)}
        .dshcurate-compress-foot{display:flex;gap:8px;justify-content:flex-end;margin-top:8px}
        .dshcurate-stale{margin-top:6px;font-size:11.5px;line-height:1.5;color:#9a6a12}
        .dshcurate-segment{margin-top:9px;padding:8px 9px;border:1px solid var(--dsw-alias-border-l2,#e6e6e6);border-radius:8px;background:var(--dsw-alias-bg-base,#fff)}
        .dshcurate-segment.keep{background:var(--dsw-alias-interactive-bg-hover,#fafafa)}
        .dshcurate-segment-head{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;font-size:11.5px;color:var(--dsw-alias-label-tertiary,#777)}
        .dshcurate-segment-head b{color:var(--dsw-alias-label-primary,#222);font-weight:600}
        .dshcurate-segment .dshcurate-hint{margin-top:7px}
        .dshcurate-msg-tones{display:inline-flex;gap:2px;padding:1px;border:1px solid var(--dsw-alias-border-l2,#ddd);border-radius:6px}
        .dshcurate-msg-tones .dshcurate-tone{height:19px;padding:0 6px;font-size:10.5px}
        .dshcurate-msg-actions{display:inline-flex;gap:4px;align-items:center}
        .dshcurate-message-head{position:sticky;top:0;z-index:2;background:var(--dsw-alias-bg-layer-1,#fff);padding:4px 2px;border-bottom:1px solid var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.12))}
        .dshcurate-message.staged .dshcurate-message-head{background:rgba(76,110,245,.06)}
        .dshcurate-snippet-pencil{flex:none;width:22px;height:20px;padding:0;border:1px solid var(--dsw-alias-border-l2,#ddd);border-radius:4px;background:transparent;color:var(--dsw-alias-label-tertiary,#777);font-size:11px;line-height:1;cursor:pointer}
        .dshcurate-snippet-pencil:hover{background:var(--dsw-alias-interactive-bg-hover,#f5f5f5);color:var(--dsw-alias-label-primary,#222)}
        .dshcurate-view{display:inline-flex;gap:2px;padding:2px;border:1px solid var(--dsw-alias-border-l2,#ddd);border-radius:7px}
        .dshcurate-view button{height:22px;padding:0 8px;border:0;border-radius:5px;background:transparent;color:var(--dsw-alias-label-tertiary,#666);font-size:11.5px;line-height:1;cursor:pointer}
        .dshcurate-view button.active{background:var(--dsw-alias-button-ghost-active-fill,var(--dsw-alias-interactive-bg-hover,#eee));color:var(--dsw-alias-label-primary,#222)}
        .dshcurate-flag{display:inline-flex;align-items:center;gap:5px;font-size:12px;color:var(--dsw-alias-label-secondary,#555);cursor:pointer}
        .dshcurate-flag input{margin:0}
        .dshcurate-version-banner{margin:0 0 10px;padding:8px 10px;border:1px solid rgba(210,140,40,.45);border-radius:8px;background:rgba(210,140,40,.10);color:#8a5a10;font-size:12px;line-height:1.55;display:flex;gap:8px;align-items:flex-start;flex-wrap:wrap}
        .dshcurate-version-banner .grow{flex:1;min-width:200px}
        .dshcurate-version-banner button{height:24px;padding:0 8px;border:1px solid rgba(210,140,40,.5);border-radius:6px;background:transparent;color:inherit;font-size:11.5px;cursor:pointer}
        .dshcurate-hidden{margin:3px 0 0;font-size:11px;line-height:1.5;color:var(--dsw-alias-label-tertiary,#777)}
        .dshcurate-scope .grow{flex:1}
      `
      document.head.appendChild(style)
      // Only remove a node this call created; an HMR-previous instance keeps
      // ownership of its own node until its own disposer runs.
      return () => {
        try {
          if (style.parentNode !== null) style.parentNode.removeChild(style)
        } catch {}
      }
    }

    // --- components ----------------------------------------------------------

    function MarkdownEditor(props) {
      const { value, mode, cwd, disabled, onMode, onChange, placeholder, label, large } = props
      const [text, setText] = react.useState(typeof value === 'string' ? value : '')
      const lastPushed = react.useRef(typeof value === 'string' ? value : '')
      const renderedRef = react.useRef(null)
      const focusedRef = react.useRef(false)
      const timerRef = react.useRef(null)
      const latest = react.useRef(text)
      latest.current = text

      react.useEffect(() => {
        if (typeof value !== 'string') return
        if (value === lastPushed.current) return
        lastPushed.current = value
        setText(value)
        if (mode === 'rendered' && renderedRef.current && !focusedRef.current) {
          renderedRef.current.innerHTML = markdownToHtml(value)
          resolveRenderedImages(renderedRef.current, cwd)
        }
      }, [value])

      react.useEffect(() => {
        if (mode !== 'rendered' || !renderedRef.current) return
        if (focusedRef.current) return
        renderedRef.current.innerHTML = markdownToHtml(text)
        resolveRenderedImages(renderedRef.current, cwd)
      }, [mode, cwd])

      react.useEffect(() => () => {
        if (timerRef.current !== null) clearTimeout(timerRef.current)
      }, [])

      function push(next) {
        lastPushed.current = next
        setText(next)
        onChange(next)
      }
      function flushRendered() {
        if (!renderedRef.current) return
        const markdown = htmlToMarkdown(renderedRef.current.innerHTML)
        if (markdown !== latest.current) push(markdown)
      }
      function onSourceChange(event) {
        push(event.target.value)
      }
      function onRenderedInput() {
        if (timerRef.current !== null) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
          timerRef.current = null
          flushRendered()
        }, 220)
      }
      function onRenderedBlur() {
        focusedRef.current = false
        if (timerRef.current !== null) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }
        flushRendered()
      }
      function switchMode(next) {
        if (mode === 'rendered') flushRendered()
        onMode(next)
      }

      const controls = jsxs('div', {
        className: 'dshcurate-modes',
        children: [
          jsx('span', { children: label || tr('edit.block') }),
          jsxs('div', {
            className: 'group',
            children: [
              jsx('button', {
                type: 'button',
                className: mode === 'source' ? 'active' : '',
                'aria-pressed': mode === 'source' ? 'true' : 'false',
                onClick: () => switchMode('source'),
                children: tr('group.view.source'),
              }),
              jsx('button', {
                type: 'button',
                className: mode === 'rendered' ? 'active' : '',
                'aria-pressed': mode === 'rendered' ? 'true' : 'false',
                onClick: () => switchMode('rendered'),
                children: tr('group.view.rendered'),
              }),
            ],
          }),
        ],
      })
      const editor = mode === 'source'
        ? jsx('textarea', {
            className: 'dshcurate-source',
            value: text,
            placeholder: placeholder || tr('edit.placeholder'),
            disabled,
            onChange: onSourceChange,
            onFocus: () => {
              focusedRef.current = true
            },
            onBlur: () => {
              focusedRef.current = false
            },
          })
        : jsx('div', {
            ref: renderedRef,
            className: `dshcurate-rendered dshcurate-md${large ? ' large' : ''}`,
            contentEditable: disabled ? false : true,
            suppressContentEditableWarning: true,
            'data-placeholder': placeholder || tr('edit.placeholder'),
            title: tr('group.view.rendered'),
            onInput: onRenderedInput,
            onBlur: onRenderedBlur,
            onFocus: () => {
              focusedRef.current = true
            },
          })
      return jsxs('div', { children: [controls, editor] })
    }

    function RenderedText(props) {
      const { text, cwd, className } = props
      const ref = react.useRef(null)
      const source = typeof text === 'string' ? text : ''
      react.useEffect(() => {
        const node = ref.current
        if (!node) return
        node.innerHTML = markdownToHtml(source)
        resolveRenderedImages(node, cwd)
      }, [source, cwd])
      return jsx('div', { ref, className: `dshcurate-md${className ? ` ${className}` : ''}` })
    }

    function MessageEditor(props) {
      const { editing, message, cwd, disabled, textOnlyView, onValue, onMode, onBlock, onBlockConfirm, onBlockCancel, onCancel, onSave } = props
      let blockList = message && Array.isArray(message.editableBlocks) ? message.editableBlocks : []
      if (editing.mode === 'tool' || editing.mode === 'context' || textOnlyView) {
        blockList = blockList.filter((block) => block.kind === 'text')
      }
      const showPicker = editing.mode !== 'prompt' && blockList.length > 1
      const pendingBlock = editing.pendingBlock !== undefined && editing.pendingBlock !== null && editing.pendingBlock !== editing.blockIndex
      const title = editing.mode === 'prompt'
        ? tr('edit.title.prompt')
        : editing.mode === 'reply'
          ? tr('edit.title.reply')
          : editing.mode === 'tool'
            ? tr('edit.title.tool')
            : tr('edit.title.context')
      return jsxs('div', {
        className: 'dshcurate-editor',
        children: [
          jsxs('div', {
            className: 'dshcurate-editor-head',
            children: [
              jsx('span', { children: title }),
              showPicker ? jsxs('label', {
                children: [
                  jsx('span', { children: tr('edit.block') }),
                  jsx('select', {
                    value: String(editing.blockIndex),
                    'aria-label': tr('edit.block'),
                    disabled,
                    onChange: (event) => onBlock(Number(event.target.value)),
                    children: blockList.map((block) => jsx('option', {
                      value: String(block.index),
                      children: block.kind === 'reasoning' ? tr('edit.block.reasoning') : tr('edit.block.text'),
                    }, block.index)),
                  }),
                ],
              }) : null,
              jsx('span', { className: 'grow' }),
            ],
          }),
          pendingBlock ? jsxs('div', {
            className: 'dshcurate-confirm',
            children: [
              jsx('p', { children: tr('edit.blockSwitch') }),
              jsxs('div', {
                className: 'row',
                children: [
                  jsx('button', { type: 'button', className: 'dshcurate-btn small', onClick: onBlockCancel, children: tr('edit.cancel') }),
                  jsx('button', { type: 'button', className: 'dshcurate-btn small primary', onClick: onBlockConfirm, children: tr('edit.blockSwitch.confirm') }),
                ],
              }),
            ],
          }) : null,
          jsx(MarkdownEditor, {
            value: editing.value,
            mode: editing.viewMode === 'source' ? 'source' : 'rendered',
            cwd,
            disabled,
            onMode,
            onChange: onValue,
            placeholder: tr('edit.placeholder'),
            label: title,
            large: true,
          }),
          message && message.attachments > 0
            ? jsx('div', { className: 'dshcurate-note', children: tr('edit.attachments', { count: message.attachments }) })
            : null,
          jsxs('div', {
            className: 'dshcurate-editor-foot',
            children: [
              jsx('span', { className: 'hint', children: tr('edit.hint') }),
              jsx('button', { type: 'button', className: 'dshcurate-btn', disabled, onClick: onCancel, children: tr('edit.cancel') }),
              jsx('button', {
                type: 'button',
                className: 'dshcurate-btn primary',
                disabled: disabled || editing.value.trim() === '',
                onClick: onSave,
                children: tr('edit.save'),
              }),
            ],
          }),
        ],
      })
    }

    function MessageDetail(props) {
      const { node, full, nodeEdits, editing, cwd, busy, textOnlyView, tone, toneDisabled, showTone, onTone, onEdit, onUndo, onLoadFull, onValue, onMode, onBlock, onBlockConfirm, onBlockCancel, onCancel, onSave } = props
      const edits = Array.isArray(nodeEdits) ? nodeEdits : []
      const role = node.role || 'context'
      const isTool = role === 'tool'
      const staged = edits.length > 0
      const editingHere = editing !== null && editing !== undefined && editing.seq === node.seq
      const editable = full ? full.editable === true : node.editable === true
      const reason = full && full.editReason ? full.editReason : node.editReason
      const blocks = full && Array.isArray(full.blocks) ? full.blocks : null
      const promptEdit = edits.find((edit) => edit.mode === 'prompt')
      const plain = typeof node.plainText === 'string' && node.plainText !== ''
        ? node.plainText
        : (typeof node.previewPlain === 'string' ? node.previewPlain : '')
      const text = full
        ? (typeof full.text === 'string' ? full.text : '')
        : (textOnlyView && plain !== '' ? plain : (typeof node.text === 'string' ? node.text : (typeof node.preview === 'string' ? node.preview : '')))
      const displayBlocks = blocks
        ? (textOnlyView ? blocks.filter((block) => block.kind === 'text') : blocks)
        : null
      function stagedBlock(index) {
        return edits.find((edit) => edit.mode !== 'prompt' && edit.blockIndex === index)
      }

      let body
      if (editingHere) {
        body = jsx(MessageEditor, {
          editing,
          message: full,
          cwd,
          disabled: busy,
          textOnlyView,
          onValue,
          onMode,
          onBlock,
          onBlockConfirm,
          onBlockCancel,
          onCancel,
          onSave,
        })
      } else if (isTool) {
        body = jsx('pre', {
          className: `dshcurate-tool-text${node.isError ? ' error' : ''}`,
          children: text === '' ? '…' : text,
        })
      } else if (full && promptEdit) {
        body = jsx(RenderedText, { text: promptEdit.text, cwd, className: 'dshcurate-message-body' })
      } else if (displayBlocks && displayBlocks.length > 0) {
        body = jsx('div', {
          className: 'dshcurate-message-body',
          children: displayBlocks.map((block) => {
            const stagedEdit = stagedBlock(block.index)
            const blockText = stagedEdit ? stagedEdit.text : (typeof block.text === 'string' ? block.text : '')
            if (block.kind === 'reasoning') {
              return jsxs('details', {
                className: 'dshcurate-reasoning',
                children: [
                  jsx('summary', { children: tr('detail.reasoning') }),
                  jsx('pre', { children: blockText }),
                ],
              }, block.index)
            }
            if (block.kind === 'text') {
              return jsx(RenderedText, { text: blockText, cwd }, block.index)
            }
            return jsx('span', {
              className: 'dshcurate-block-chip',
              title: block.type === 'tool-call' ? tr('edit.toolArgsReadOnly') : undefined,
              children: block.label || block.type || 'block',
            }, block.index)
          }),
        })
      } else {
        const fallback = promptEdit ? promptEdit.text : (textOnlyView && plain !== '' ? plain : text)
        body = jsx(RenderedText, { text: fallback, cwd, className: 'dshcurate-message-body' })
      }

      return jsxs('div', {
        className: `dshcurate-message${staged ? ' staged' : ''}`,
        children: [
          jsxs('div', {
            className: 'dshcurate-message-head',
            children: [
              jsx('span', { className: `dshcurate-role ${role}`, children: roleText(role) }),
              jsx('span', { className: 'seq', children: `#${node.seq}` }),
              node.turn !== null && node.turn !== undefined ? jsx('span', { children: `· ${tr('group.range', { turn: node.turn })}` }) : null,
              node.attachments > 0 ? jsx('span', { children: tr('detail.attachments', { count: node.attachments }) }) : null,
              node.patched || (full && full.patched) ? jsx('span', { className: 'dshcurate-badge', children: tr('detail.patched') }) : null,
              staged ? jsx('span', { className: 'dshcurate-badge edit', children: tr('edit.staged') }) : null,
              showTone !== false && (tone === 'keep' || tone === 'normal' || tone === 'minor')
                ? jsx('div', {
                    className: 'dshcurate-msg-tones',
                    children: ['keep', 'normal', 'minor'].map((value) => jsx('button', {
                      type: 'button',
                      className: `dshcurate-tone${tone === value ? ' active' : ''}`,
                      title: tr(`tone.${value}.hint`),
                      'aria-pressed': tone === value ? 'true' : 'false',
                      disabled: toneDisabled === true,
                      onClick: () => {
                        if (typeof onTone === 'function') onTone(node, value)
                      },
                      children: tr(`tone.${value}`),
                    }, value)),
                  })
                : null,
              jsx('span', { className: 'spring' }),
              staged ? jsx('button', { type: 'button', className: 'dshcurate-btn small', onClick: () => onUndo(node), children: tr('edit.undo') }) : null,
              !full ? jsx('button', { type: 'button', className: 'dshcurate-btn small', disabled: busy, onClick: () => onLoadFull(node), children: tr('detail.loadFull') }) : null,
              editable && !editingHere ? jsx('button', { type: 'button', className: 'dshcurate-btn small', disabled: busy, onClick: () => onEdit(node), children: tr('edit.entry') }) : null,
            ],
          }),
          full && full.truncated ? jsx('div', { className: 'dshcurate-note', children: tr('detail.truncated') }) : null,
          !editable && reason ? jsx('div', { className: 'dshcurate-note', children: String(reason) }) : null,
          body,
        ],
      })
    }

    function roleText(role) {
      const key = `misc.${typeof role === 'string' ? role : 'context'}`
      const label = tr(key)
      return label === key ? String(role || '') : label
    }

    function isConversationNode(node, textOnlyView) {
      if (!node) return false
      if (!textOnlyView) return true
      if (node.role === 'user') return true
      if (node.role !== 'assistant') return false
      const plain = typeof node.plainText === 'string' && node.plainText !== ''
        ? node.plainText
        : (typeof node.previewPlain === 'string' ? node.previewPlain : (typeof node.preview === 'string' ? node.preview : ''))
      return plain.trim() !== ''
    }

    function Snippet(props) {
      const { node, full, textOnly, onEdit } = props
      const text = full && typeof node.text === 'string'
        ? node.text
        : (textOnly && typeof node.previewPlain === 'string' ? node.previewPlain : (typeof node.preview === 'string' ? node.preview : ''))
      return jsxs('div', {
        className: `dshcurate-snippet${node.isError ? ' error' : ''}`,
        children: [
          jsx('span', { className: `dshcurate-role ${node.role || 'context'}`, children: roleText(node.role) }),
          jsx('span', { className: 'dshcurate-snippet-seq', children: `#${node.seq}` }),
          jsx('span', { className: 'dshcurate-snippet-text', children: text === '' ? '…' : text }),
          node.editable && typeof onEdit === 'function'
            ? jsx('button', {
                type: 'button',
                className: 'dshcurate-snippet-pencil',
                title: tr('edit.entry'),
                'aria-label': tr('edit.entry'),
                onClick: () => onEdit(node),
                children: '✎',
              })
            : null,
        ],
      })
    }

    function GroupSnippets(props) {
      const {
        nodes, detail, loading, cwd, edits, messages, busy, editing, textOnlyView,
        onLoadDetail, onCloseDetail, onEdit, onEditSnippet, onUndo, onLoadFull,
        onValue, onEditorMode, onBlock, onBlockConfirm, onBlockCancel, onCancel, onSave,
        toneOfNode, onNodeTone, toneDisabledForNode,
      } = props
      const full = Array.isArray(detail) && detail.length > 0
      const allNodes = full ? detail : nodes
      const shown = textOnlyView ? allNodes.filter((node) => isConversationNode(node, true)) : allNodes
      const hiddenCount = allNodes.length - shown.length
      // Large detail expansions render one page at a time so a 300+ message
      // group does not run every markdown sanitizer in a single render pass.
      const [detailLimit, setDetailLimit] = react.useState(DETAIL_PAGE_SIZE)
      react.useEffect(() => {
        if (!full) setDetailLimit(DETAIL_PAGE_SIZE)
      }, [full])
      const renderedDetail = full && shown.length > detailLimit ? shown.slice(0, detailLimit) : shown
      const remainingDetail = full ? shown.length - renderedDetail.length : 0
      const editsOf = (node) => (Array.isArray(edits) ? edits.filter((edit) => edit.seq === node.seq) : [])
      return jsxs('div', {
        className: 'dshcurate-snippets-wrap',
        children: [
          full
            ? jsx('div', {
                className: 'dshcurate-detail',
                children: jsx('div', {
                  className: 'dshcurate-detail-list',
                  children: shown.length === 0
                    ? jsx('div', { className: 'dshcurate-note', children: tr('view.empty') })
                    : renderedDetail.map((node) => jsx(MessageDetail, {
                        node,
                        full: messages && messages[node.seq] ? messages[node.seq] : null,
                        nodeEdits: editsOf(node),
                        editing: editing && editing.seq === node.seq ? editing : null,
                        cwd,
                        busy,
                        textOnlyView,
                        tone: toneOfNode ? toneOfNode(node) : null,
                        toneDisabled: toneDisabledForNode ? toneDisabledForNode(node) : true,
                        onTone: onNodeTone,
                        onEdit,
                        onUndo,
                        onLoadFull,
                        onValue,
                        onMode: onEditorMode,
                        onBlock,
                        onBlockConfirm,
                        onBlockCancel,
                        onCancel,
                        onSave,
                      }, node.seq)),
                }),
              })
            : jsx('div', {
                className: 'dshcurate-snippets',
                children: shown.map((node) => jsx(Snippet, { node, full: false, textOnly: textOnlyView, onEdit: onEditSnippet }, node.seq)),
              }),
          jsxs('div', {
            className: 'dshcurate-snippet-tools',
            children: [
              jsx('span', {
                className: 'muted',
                children: full ? tr('content.loaded', { count: shown.length }) : tr('content.hint', { count: shown.length }),
              }),
              hiddenCount > 0 ? jsx('span', { className: 'muted', children: tr('view.hidden', { count: hiddenCount }) }) : null,
              jsx('button', {
                type: 'button',
                className: 'dshcurate-btn small',
                disabled: loading,
                onClick: full ? onCloseDetail : onLoadDetail,
                children: loading ? tr('content.loading') : (full ? tr('content.collapse') : tr('content.expand')),
              }),
              remainingDetail > 0
                ? jsx('button', {
                    type: 'button',
                    className: 'dshcurate-btn small',
                    onClick: () => setDetailLimit((value) => value + DETAIL_PAGE_SIZE),
                    children: tr('content.showMore', { count: remainingDetail }),
                  })
                : null,
            ],
          }),
        ],
      })
    }

    function GroupCard(props) {
      const {
        group, surface, cwd, disabled, edits, messages, busy, editing, textOnlyView,
        segments, groupTone, onGroupTone, onNodeTone, toneOfNode, toneDisabledForNode,
        onSplit, onMerge, canMerge,
        detail, detailLoading, onLoadDetail, onCloseDetail, onEdit, onEditSnippet, onUndo, onLoadFull,
        onValue, onEditorMode, onBlock, onBlockConfirm, onBlockCancel, onCancel, onSave,
      } = props
      const start = surface[group.startIndex]
      const end = surface[group.endIndex]
      const nodes = surface.slice(group.startIndex, group.endIndex + 1)
      const visibleNodes = textOnlyView ? nodes.filter((node) => isConversationNode(node, true)) : nodes
      const hiddenCount = nodes.length - visibleNodes.length
      const groupEdits = Array.isArray(edits) ? edits.filter((edit) => {
        const index = surface.findIndex((node) => node.seq === edit.seq)
        return index >= group.startIndex && index <= group.endIndex
      }) : []
      const tokens = visibleNodes.reduce((sum, node) => sum + (Number.isFinite(node.tokens) ? node.tokens : 0), 0)
      const counts = { user: 0, assistant: 0, tool: 0, context: 0 }
      for (const node of visibleNodes) if (Object.prototype.hasOwnProperty.call(counts, node.role)) counts[node.role] += 1
      const title = group.turn === null || group.turn === undefined ? tr('group.noTurn') : tr('group.range', { turn: group.turn })
      const toneOptions = ['keep', 'normal', 'minor'].map((tone) => jsx('button', {
        type: 'button',
        className: `dshcurate-tone${groupTone === tone ? ' active' : ''}`,
        title: tr(`tone.${tone}.hint`),
        'aria-pressed': groupTone === tone ? 'true' : 'false',
        disabled: disabled,
        onClick: () => onGroupTone(tone),
        children: tr(`tone.${tone}`),
      }, tone))

      const segmentViews = (Array.isArray(segments) ? segments : []).map((segment) => {
        const segmentNodes = surface.slice(segment.startIndex, segment.endIndex + 1)
        const segmentHidden = textOnlyView ? segmentNodes.filter((node) => !isConversationNode(node, true)).length : 0
        const head = jsxs('div', {
          className: 'dshcurate-segment-head',
          children: [
            jsx('b', { children: tr(`tone.${segment.tone}`) }),
            jsx('span', { children: tr('segment.range', { start: segment.startSeq, end: segment.endSeq, count: segment.count }) }),
            jsx('span', { children: tr('group.tokens', { tokens: fmtTokens(segment.tokens) }) }),
            segmentHidden > 0 ? jsx('span', { children: tr('segment.hidden', { count: segmentHidden }) }) : null,
          ],
        })
        if (segment.tone === 'keep') {
          return jsxs('div', {
            className: 'dshcurate-segment keep',
            children: [head, jsx('div', { className: 'dshcurate-note', children: tr('segment.keep.note') })],
          }, segment.key)
        }
        return jsxs('div', {
          className: 'dshcurate-segment',
          children: [head, jsx('div', { className: 'dshcurate-note', children: tr('segment.autoSummary') })],
        }, segment.key)
      })

      return jsxs('div', {
        className: `dshcurate-card${group.locked ? ' locked' : ''}`,
        children: [
          jsxs('div', {
            className: 'dshcurate-card-head',
            children: [
              jsxs('div', {
                className: 'dshcurate-card-meta',
                children: [
                  jsx('b', { children: title }),
                  jsx('span', { children: ` · #${start.seq}–#${end.seq} · ` }),
                  jsx('span', { children: tr('group.counts', counts) }),
                  jsx('span', { children: ` · ${tr('group.tokens', { tokens: fmtTokens(tokens) })}` }),
                  group.locked ? jsx('span', { className: 'dshcurate-badge', children: tr('locked.badge') }) : null,
                  group.locked && segments.some((segment) => segment.tone !== 'keep')
                    ? jsx('span', { className: 'dshcurate-badge', children: tr('locked.override') })
                    : null,
                  groupTone === 'mixed' ? jsx('span', { className: 'dshcurate-badge', children: tr('tone.mixed') }) : null,
                  groupEdits.length > 0 ? jsx('span', { className: 'dshcurate-badge edit', children: tr('footer.pending', { count: groupEdits.length }) }) : null,
                  textOnlyView && hiddenCount > 0 ? jsx('span', { className: 'dshcurate-badge', children: tr('view.hidden', { count: hiddenCount }) }) : null,
                ],
              }),
              jsx('div', { className: 'dshcurate-tones', children: toneOptions }),
            ],
          }),
          jsx(GroupSnippets, {
            nodes,
            detail,
            loading: detailLoading,
            cwd,
            edits,
            messages,
            busy,
            editing,
            textOnlyView,
            onLoadDetail,
            onCloseDetail,
            onEdit,
            onEditSnippet,
            onUndo,
            onLoadFull,
            onValue,
            onEditorMode,
            onBlock,
            onBlockConfirm,
            onBlockCancel,
            onCancel,
            onSave,
            toneOfNode,
            onNodeTone,
            toneDisabledForNode,
          }),
          ...segmentViews,
          jsxs('div', {
            className: 'dshcurate-tools',
            children: [
              jsx('button', { type: 'button', className: 'dshcurate-btn small', disabled: disabled || group.locked, onClick: onSplit, children: tr('group.split') }),
              canMerge ? jsx('button', { type: 'button', className: 'dshcurate-btn small', disabled: disabled || group.locked, onClick: onMerge, children: tr('group.merge') }) : null,
            ],
          }),
        ],
      })
    }

    function Workbench(props) {
      const { sessionId, onClose, docked = false } = props
      // Re-render when the host locale switches (panel copy follows it).
      useLocaleTick()
      const titleId = react.useId()
      const panelRef = react.useRef(null)
      const [phase, setPhase] = react.useState('loading')
      const [state, setState] = react.useState(null)
      const [surface, setSurface] = react.useState([])
      const [groups, setGroups] = react.useState([])
      const [preserveTurns, setPreserveTurns] = react.useState(2)
      const [errorText, setErrorText] = react.useState('')
      const [toast, setToast] = react.useState('')
      const [banner, setBanner] = react.useState(null)
      const [details, setDetails] = react.useState({})
      const [detailBusy, setDetailBusy] = react.useState('')
      const [messages, setMessages] = react.useState({})
      const [messageBusy, setMessageBusy] = react.useState(0)
      const [edits, setEdits] = react.useState([])
      const [editing, setEditing] = react.useState(null)
      const [applyingEdits, setApplyingEdits] = react.useState(false)
      const [compressOpen, setCompressOpen] = react.useState(false)
      const [compressTarget, setCompressTarget] = react.useState('direct')
      const [compressMethod, setCompressMethod] = react.useState('curated')
      const [compressChecked, setCompressChecked] = react.useState(false)
      const [helpOpen, setHelpOpen] = react.useState(false)
      const [undoStack, setUndoStack] = react.useState([])
      const [compacting, setCompacting] = react.useState(false)
      const [focusSeq, setFocusSeq] = react.useState(null)
      const [textOnlyView, setTextOnlyView] = react.useState(false)
      const [summaryTextOnly, setSummaryTextOnly] = react.useState(false)
      const [tones, setTones] = react.useState({})
      const [draftNotice, setDraftNotice] = react.useState('')
      const toastTimer = react.useRef(null)
      // True while a non-empty saved draft could not be restored at all: the
      // autosave must not overwrite it with an empty payload.
      const protectedDraftRef = react.useRef(false)
      // Latest committed draft payload, used to flush the debounce on unmount.
      const latestDraftRef = react.useRef(null)
      const draftReadyRef = react.useRef(false)
      const draftTimerRef = react.useRef(null)
      // Token/abort pair for load(): a superseded response must never win.
      const loadTokenRef = react.useRef(null)
      const loadAbortRef = react.useRef(null)
      const mountedRef = react.useRef(true)
      // The scroll container of the workbench body; the compression sheet is
      // rendered at its top.
      const bodyRef = react.useRef(null)

      // Opening the compression sheet inserts it at the top of the scrollable
      // body. A user who is scrolled down would otherwise see nothing change:
      // the browser keeps their scroll anchor, so the sheet opens far above the
      // viewport and the button looks dead. Scroll it into view and focus the
      // first control for keyboard users.
      react.useEffect(() => {
        if (!compressOpen) return undefined
        const body = bodyRef.current
        if (body !== null) body.scrollTop = 0
        const timer = setTimeout(() => {
          const dialog = body !== null ? body.querySelector('.dshcurate-compress') : null
          const focusable = dialog !== null
            ? dialog.querySelector('input[type="radio"], input[type="checkbox"], button')
            : null
          if (focusable !== null && typeof focusable.focus === 'function') {
            try {
              focusable.focus({ preventScroll: true })
            } catch {
              focusable.focus()
            }
          }
        }, 30)
        return () => clearTimeout(timer)
      }, [compressOpen])

      function showToast(message) {
        setToast(message)
        if (toastTimer.current !== null) clearTimeout(toastTimer.current)
        toastTimer.current = setTimeout(() => setToast(''), 6000)
      }

      function restoredEdits(data, saved) {
        const seqs = new Set((Array.isArray(data.nodes) ? data.nodes : []).map((node) => node.seq))
        const restored = []
        for (const item of saved.edits) {
          if (!item || typeof item !== 'object') continue
          if (item.mode !== 'prompt' && item.mode !== 'reply' && item.mode !== 'tool' && item.mode !== 'context') continue
          if (typeof item.seq !== 'number' || !seqs.has(item.seq)) continue
          if (typeof item.text !== 'string') continue
          if (item.mode !== 'prompt' && typeof item.blockIndex !== 'number') continue
          restored.push({
            key: editKeyFor(item.mode, item.seq, item.blockIndex),
            seq: item.seq,
            messageId: item.messageId || null,
            mode: item.mode,
            blockIndex: typeof item.blockIndex === 'number' ? item.blockIndex : undefined,
            kind: typeof item.kind === 'string' ? item.kind : undefined,
            text: item.text,
            original: typeof item.original === 'string' ? item.original : '',
          })
        }
        return restored
      }

      function applyLoaded(data) {
        setUndoStack([])
        setDetails({})
        setDetailBusy('')
        setMessages({})
        setEditing(null)
        setState(data)
        const saved = readDraft(sessionId)
        const usable = saved !== null && typeof saved === 'object' && DRAFT_VERSIONS.has(saved.version) ? saved : null
        const savedHasContent = saved !== null && typeof saved === 'object' && draftHasContent(saved)
        const fallbackPreserve = normalizePreserveTurns(data.preserveRecentTurns)
        const savedPreserve = usable !== null ? normalizePreserveTurns(usable.preserveTurns) : null
        const nextPreserve = savedPreserve !== null ? savedPreserve : (fallbackPreserve !== null ? fallbackPreserve : 2)
        const built = buildGroups(data, nextPreserve)
        setSurface(built.surface)
        setGroups(built.groups)
        setPreserveTurns(nextPreserve)
        const seqs = new Set((Array.isArray(data.nodes) ? data.nodes : []).map((node) => node.seq))
        let restoredCount = 0
        if (usable !== null) {
          const toneMap = {}
          for (const item of Array.isArray(usable.tones) ? usable.tones : []) {
            if (!item || typeof item.seq !== 'number' || !seqs.has(item.seq)) continue
            if (item.tone !== 'keep' && item.tone !== 'normal' && item.tone !== 'minor') continue
            toneMap[item.seq] = item.tone
          }
          const restored = restoredEdits(data, usable)
          restoredCount = Object.keys(toneMap).length + restored.length
          setTones(toneMap)
          setEdits(restored)
          setTextOnlyView(usable.textOnlyView === true)
          setSummaryTextOnly(usable.summaryTextOnly === true)
        } else {
          setTones({})
          setEdits([])
          setTextOnlyView(false)
          setSummaryTextOnly(false)
        }
        // Seq numbers survive an append-only session, so a draft saved before
        // the log grew is still usable for the messages that still exist. Warn
        // when that earlier state was partially (or not at all) restored.
        const savedLastSeq = usable !== null && typeof usable.lastSeq === 'number' ? usable.lastSeq : null
        const staleDraft = usable !== null && (savedLastSeq === null || savedLastSeq !== data.lastSeq)
        protectedDraftRef.current = savedHasContent && restoredCount === 0
        setDraftNotice(staleDraft ? tr(restoredCount > 0 ? 'draft.restored' : 'draft.unrestorable') : '')
        setPhase('ready')
        setErrorText('')
      }

      async function load() {
        // Supersede any in-flight load so a slow older response cannot
        // overwrite a newer one, and ignore responses after unmount.
        const token = {}
        loadTokenRef.current = token
        if (loadAbortRef.current !== null) {
          try {
            loadAbortRef.current.abort()
          } catch {}
        }
        const controller = typeof AbortController === 'function' ? new AbortController() : null
        loadAbortRef.current = controller
        setPhase('loading')
        setErrorText('')
        try {
          const data = await loadState(sessionId, controller !== null ? controller.signal : undefined)
          if (loadTokenRef.current !== token || !mountedRef.current) return
          applyLoaded(data)
        } catch (error) {
          if (loadTokenRef.current !== token || !mountedRef.current) return
          if (error && error.name === 'AbortError') return
          setErrorText(rawErrorMessage(error))
          setPhase('error')
        }
      }

      react.useEffect(() => {
        mountedRef.current = true
        load()
        return () => {
          mountedRef.current = false
          loadTokenRef.current = null
          if (loadAbortRef.current !== null) {
            try {
              loadAbortRef.current.abort()
            } catch {}
            loadAbortRef.current = null
          }
          if (toastTimer.current !== null) clearTimeout(toastTimer.current)
          // Closing the panel inside the autosave debounce must not drop the
          // latest committed tone/view/edit change: flush the last payload.
          if (draftReadyRef.current && latestDraftRef.current !== null) {
            const payload = latestDraftRef.current
            if (!(protectedDraftRef.current && !draftHasContent(payload))) writeDraft(sessionId, payload)
          }
        }
      }, [sessionId])

      function draftPayload() {
        return {
          version: DRAFT_VERSION,
          lastSeq: state ? state.lastSeq : -1,
          preserveTurns,
          textOnlyView,
          summaryTextOnly,
          tones: Object.keys(tones).map((seq) => ({ seq: Number(seq), tone: tones[seq] })),
          edits: edits.map((edit) => ({
            seq: edit.seq,
            messageId: edit.messageId,
            mode: edit.mode,
            blockIndex: edit.blockIndex,
            kind: edit.kind,
            text: edit.text,
            original: edit.original,
          })),
        }
      }

      function saveDraftNow() {
        // An explicit save is the user's decision, so it always rewrites the
        // stored draft; only then report success (storage may be blocked/full).
        if (writeDraft(sessionId, draftPayload())) {
          protectedDraftRef.current = false
          showToast(tr('toast.saved'))
        } else {
          showToast(tr('toast.saveFailed'))
        }
      }

      function snapshotWorkbench() {
        return {
          tones: { ...tones },
          edits: edits.map((edit) => ({ ...edit })),
          groups: groups.map((group) => ({ ...group })),
          preserveTurns,
          textOnlyView,
          summaryTextOnly,
        }
      }

      function pushUndo() {
        const snapshot = snapshotWorkbench()
        setUndoStack((current) => [...current.slice(-49), snapshot])
      }

      function undoLast() {
        if (undoStack.length === 0) {
          showToast(tr('undo.empty'))
          return
        }
        const last = undoStack[undoStack.length - 1]
        setTones(last.tones)
        setEdits(last.edits)
        if (Array.isArray(last.groups)) setGroups(last.groups)
        if (typeof last.preserveTurns === 'number') setPreserveTurns(last.preserveTurns)
        setTextOnlyView(last.textOnlyView === true)
        setSummaryTextOnly(last.summaryTextOnly === true)
        setEditing(null)
        setUndoStack((current) => current.slice(0, -1))
        showToast(tr('undo.done'))
      }

      react.useEffect(() => {
        if (phase !== 'ready') return undefined
        const payload = draftPayload()
        latestDraftRef.current = payload
        draftReadyRef.current = true
        const write = () => {
          // Never autosave an empty draft over a non-empty saved draft that
          // could not be restored.
          if (protectedDraftRef.current && !draftHasContent(payload)) return
          if (writeDraft(sessionId, payload)) protectedDraftRef.current = false
        }
        const handle = setTimeout(write, 350)
        draftTimerRef.current = handle
        return () => {
          clearTimeout(handle)
          if (draftTimerRef.current === handle) draftTimerRef.current = null
        }
      }, [phase, groups, preserveTurns, edits, state, textOnlyView, summaryTextOnly, tones])

      /** Drop a queued autosave so an explicit clear cannot be resurrected. */
      function cancelPendingDraftWrite() {
        if (draftTimerRef.current !== null) {
          clearTimeout(draftTimerRef.current)
          draftTimerRef.current = null
        }
      }

      function rangeKeyOf(group) {
        const start = surface[group.startIndex]
        const end = surface[group.endIndex]
        return start !== undefined && end !== undefined ? `${start.seq}-${end.seq}` : ''
      }

      function detailOf(group) {
        const key = rangeKeyOf(group)
        return key === '' ? null : (details[key] || null)
      }

      async function fetchDetail(group) {
        const start = surface[group.startIndex]
        const end = surface[group.endIndex]
        if (start === undefined || end === undefined) return null
        const key = `${start.seq}-${end.seq}`
        setDetailBusy(key)
        try {
          const data = await loadContent(sessionId, start.seq, end.seq)
          const nodes = Array.isArray(data.nodes) ? data.nodes : []
          setDetails((current) => ({ ...current, [key]: nodes }))
          return nodes
        } catch (error) {
          showToast(tr('content.failed', { error: String(error && error.message ? error.message : error) }))
          return null
        } finally {
          setDetailBusy('')
        }
      }

      async function toggleDetail(group) {
        const key = rangeKeyOf(group)
        if (key === '') return
        if (details[key] !== undefined) {
          setDetails((current) => {
            const next = { ...current }
            delete next[key]
            return next
          })
          return
        }
        await fetchDetail(group)
      }

      async function loadFull(node) {
        if (!node || typeof node.seq !== 'number') return null
        if (messages[node.seq]) return messages[node.seq]
        setMessageBusy((value) => value + 1)
        try {
          const data = await loadMessage(sessionId, node.seq)
          setMessages((current) => ({ ...current, [node.seq]: data }))
          return data
        } catch (error) {
          showToast(tr('edit.failed', { error: String(error && error.message ? error.message : error) }))
          return null
        } finally {
          setMessageBusy((value) => Math.max(0, value - 1))
        }
      }

      async function openEditor(node) {
        if (!node) return
        const full = messages[node.seq] || await loadFull(node)
        if (!full) return
        if (full.editable !== true) {
          showToast(typeof full.editReason === 'string' && full.editReason !== '' ? full.editReason : tr('edit.readOnly'))
          return
        }
        const mode = full.editKind === 'prompt' || full.editKind === 'reply' || full.editKind === 'tool' || full.editKind === 'context'
          ? full.editKind
          : 'prompt'
        let blockIndex = null
        let kind = null
        let original = ''
        let value = ''
        if (mode !== 'prompt') {
          let blocks = Array.isArray(full.editableBlocks) ? full.editableBlocks : []
          if (mode === 'tool' || mode === 'context' || textOnlyView) blocks = blocks.filter((block) => block.kind === 'text')
          if (blocks.length === 0) {
            showToast(tr('edit.readOnly'))
            return
          }
          const previous = edits.find((edit) => edit.seq === node.seq && edit.mode === mode)
          const block = previous
            ? (blocks.find((candidate) => candidate.index === previous.blockIndex) || blocks[0])
            : (blocks.find((candidate) => candidate.kind === 'text') || blocks[0])
          blockIndex = block.index
          kind = block.kind
          original = block.text
          const staged = edits.find((edit) => edit.key === editKeyFor(mode, node.seq, blockIndex))
          value = staged ? staged.text : original
        } else {
          original = typeof full.promptText === 'string' ? full.promptText : ''
          const staged = edits.find((edit) => edit.key === editKeyFor('prompt', node.seq))
          value = staged ? staged.text : original
        }
        setEditing({
          seq: node.seq,
          messageId: node.messageId || full.messageId || null,
          mode,
          blockIndex,
          kind,
          original,
          value,
          viewMode: mode === 'tool' ? 'source' : 'rendered',
          message: full,
        })
      }

      async function editFromPreview(group, node) {
        if (!group || !node) return
        const key = rangeKeyOf(group)
        if (details[key] === undefined) {
          const nodes = await fetchDetail(group)
          if (!nodes) return
        }
        await openEditor(node)
      }

      function setEditorValue(value) {
        setEditing((current) => (current ? { ...current, value } : current))
      }

      function setEditorMode(mode) {
        setEditing((current) => (current ? { ...current, viewMode: mode === 'source' ? 'source' : 'rendered' } : current))
      }

      /** Apply a pending block pick inside the open editor (no confirm layer). */
      function applyEditorBlock(current, index) {
        if (!current || !current.message) return current
        let blocks = Array.isArray(current.message.editableBlocks) ? current.message.editableBlocks : []
        if (current.mode === 'tool' || current.mode === 'context' || textOnlyView) {
          blocks = blocks.filter((block) => block.kind === 'text')
        }
        const block = blocks.find((candidate) => candidate.index === index)
        if (!block) return current
        const staged = edits.find((edit) => edit.key === editKeyFor(current.mode, current.seq, index))
        return {
          ...current,
          blockIndex: block.index,
          kind: block.kind,
          original: block.text,
          value: staged ? staged.text : block.text,
          pendingBlock: undefined,
        }
      }

      function setEditorBlock(index) {
        if (!editing || !editing.message) return
        // Switching blocks with an unsaved change used to call window.confirm;
        // ask inline instead (localized, non-blocking).
        if (editing.value !== editing.original) {
          setEditing({ ...editing, pendingBlock: index })
          return
        }
        setEditing(applyEditorBlock(editing, index))
      }

      function confirmBlockSwitch() {
        if (!editing || editing.pendingBlock === undefined || editing.pendingBlock === null) return
        setEditing(applyEditorBlock(editing, editing.pendingBlock))
      }

      function cancelBlockSwitch() {
        setEditing((current) => (current ? { ...current, pendingBlock: undefined } : current))
      }

      function cancelEditor() {
        setEditing(null)
      }

      function saveEditor() {
        if (!editing) return
        const text = typeof editing.value === 'string' ? editing.value : ''
        // Early returns must not leave a no-op snapshot on the undo stack.
        if (text.trim() === '') return
        if (text === editing.original) {
          setEditing(null)
          showToast(tr('edit.unchanged'))
          return
        }
        pushUndo()
        const key = editKeyFor(editing.mode, editing.seq, editing.blockIndex)
        const next = {
          key,
          seq: editing.seq,
          messageId: editing.messageId,
          mode: editing.mode,
          blockIndex: editing.blockIndex,
          kind: editing.kind,
          text,
          original: editing.original,
        }
        setEdits((current) => [...current.filter((edit) => edit.key !== key), next])
        setEditing(null)
        showToast(tr('edit.staged'))
      }

      function undoEditsForNode(seq) {
        pushUndo()
        setEdits((current) => current.filter((edit) => edit.seq !== seq))
        setEditing((current) => (current && current.seq === seq ? null : current))
      }

      function rebuildKeepTurns(nextPreserve) {
        if (!state) return
        setDetails({})
        const built = buildGroups(state, nextPreserve)
        setSurface(built.surface)
        setGroups(built.groups)
        setPreserveTurns(nextPreserve)
      }

      function changeTextOnlyView(next) {
        setTextOnlyView(next === true)
      }

      function changeSummaryTextOnly(next) {
        pushUndo()
        setSummaryTextOnly(next === true)
      }

      function changePreserve(event) {
        const next = Number(event.target.value)
        pushUndo()
        rebuildKeepTurns(next)
      }

      function setGroupTone(group, tone) {
        if (!group) return
        pushUndo()
        setTones((current) => {
          const next = { ...current }
          for (let index = group.startIndex; index <= group.endIndex; index += 1) {
            const node = surface[index]
            if (node) next[node.seq] = tone
          }
          return next
        })
      }

      function setNodeTone(node, tone) {
        if (!node) return
        const index = surface.findIndex((candidate) => candidate.seq === node.seq)
        if (index < 0) return
        const group = groupAt.get(index)
        if (!group) return
        pushUndo()
        const unit = units.unitOf(index)
        setTones((current) => {
          const next = { ...current }
          for (const unitIndex of unit) {
            const targetNode = surface[unitIndex]
            if (targetNode) next[targetNode.seq] = tone
          }
          return next
        })
      }

      function onSplit(group) {
        const index = middleCut(surface, group.startIndex, group.endIndex)
        if (index === null) {
          showToast(tr('toast.noSplit'))
          return
        }
        pushUndo()
        setGroups((current) => {
          const next = []
          for (const item of current) {
            if (item.id !== group.id) {
              next.push(item)
              continue
            }
            const left = { ...item, endIndex: index, id: `${surface[item.startIndex].seq}-${surface[index].seq}` }
            const right = { ...item, startIndex: index + 1, id: `${surface[index + 1].seq}-${surface[item.endIndex].seq}` }
            next.push(left, right)
          }
          return next
        })
      }

      function onMerge(group) {
        const index = groups.findIndex((item) => item.id === group.id)
        if (index === -1 || index >= groups.length - 1) return
        // Refusing to merge into the locked recent turns is a real answer: say
        // so instead of silently doing nothing (and do not push a no-op undo).
        if (groups[index + 1].locked) {
          showToast(tr('toast.mergeLocked'))
          return
        }
        pushUndo()
        setGroups((current) => {
          const currentIndex = current.findIndex((item) => item.id === group.id)
          if (currentIndex === -1 || currentIndex === current.length - 1) return current
          const nextGroup = current[currentIndex + 1]
          if (nextGroup.locked) return current
          const merged = {
            ...group,
            endIndex: nextGroup.endIndex,
            id: `${surface[group.startIndex].seq}-${surface[nextGroup.endIndex].seq}`,
          }
          const next = current.slice(0, currentIndex)
          next.push(merged, ...current.slice(currentIndex + 2))
          return next
        })
      }

      const groupAt = new Map()
      for (const group of groups) {
        for (let index = group.startIndex; index <= group.endIndex; index += 1) groupAt.set(index, group)
      }
      const units = buildToneUnits(surface)
      const toneAt = (index) => {
        const node = surface[index]
        if (!node) return 'normal'
        const group = groupAt.get(index)
        if (!group) return 'keep'
        // A recent turn defaults to keep, but an explicit per-message/group tone
        // is an opt-in override: the user may deliberately compress part of it.
        if (group.locked) return tones[node.seq] || 'keep'
        return tones[node.seq] || 'normal'
      }
      const groupSegments = new Map()
      for (const group of groups) groupSegments.set(group.id, segmentsForGroup(group, surface, toneAt, units))
      const segmentsOfGroup = (group) => groupSegments.get(group.id) || []
      const compressSegments = []
      for (const group of groups) {
        for (const segment of segmentsOfGroup(group)) {
          if (segment.tone !== 'keep') compressSegments.push({ ...segment, group })
        }
      }
      const selected = compressSegments
      const selectedTokens = compressSegments.reduce((sum, segment) => sum + segment.tokens, 0)
      const summaryTokens = compressSegments.reduce((sum, segment) => sum + estimatedSummaryTokens(segment), 0)
      const surfaceTokens = state ? state.surfaceTokens : 0
      const afterTokens = Math.max(0, surfaceTokens - selectedTokens + summaryTokens)
      const totalMessages = compressSegments.reduce((sum, segment) => sum + segment.count, 0)
      const keptMessages = groups.reduce((sum, group) => {
        const current = segmentsOfGroup(group)
        if (!current.some((segment) => segment.tone !== 'keep')) return sum
        return sum + current
          .filter((segment) => segment.tone === 'keep')
          .reduce((count, segment) => count + segment.count, 0)
      }, 0)
      const capabilities = state && state.capabilities && typeof state.capabilities === 'object' ? state.capabilities : null
      const hostVersion = state && typeof state.version === 'string' ? state.version : ''
      const versionIssue = phase === 'ready' && (hostVersion === '' || hostVersion !== PLUGIN_VERSION)
      const patchUnavailable = phase === 'ready' && capabilities !== null && capabilities.patch === false
      const busySession = Boolean(state && state.busy)
      const canApplyEdits = phase === 'ready' && !busySession && edits.length > 0 && !applyingEdits && !compacting
      const canCurated = phase === 'ready' && !busySession && compressSegments.length > 0 && !compacting
      const canOfficial = phase === 'ready' && !busySession && capabilities !== null && capabilities.compaction === true && !compacting
      const canConfirmCompression = !compacting
        && (compressTarget === 'direct' || edits.length > 0)
        && (compressMethod === 'curated' ? canCurated : canOfficial)
      const tailNode = surface.length > 0 ? surface[surface.length - 1] : null

      /**
       * Mirror the host's edit application on the local surface: prompt edits
       * land a replacement node at the same position, reply/tool/context edits
       * only change the effective node text. Used both to refresh the cards
       * after "apply edits" and to rebase the selected compression ranges when
       * "compress the modified context" applies edits first.
       */
      function projectionAfterEdits(data) {
        const applied = Array.isArray(data.applied) ? data.applied : []
        const unchanged = Array.isArray(data.unchanged) ? data.unchanged : []
        const nodes = data.nodes && typeof data.nodes === 'object' ? data.nodes : {}
        const nextTones = { ...tones }
        for (const item of applied) {
          if (item.mode === 'prompt' && nextTones[item.seq] !== undefined) {
            nextTones[item.replacementSeq] = nextTones[item.seq]
            delete nextTones[item.seq]
          }
        }
        const nextSurface = surface.map((node) => {
          const prompt = applied.find((item) => item.mode === 'prompt' && item.seq === node.seq)
          if (prompt) {
            const replacement = nodes[prompt.replacementSeq]
            return replacement || { ...node, seq: prompt.replacementSeq, patched: true }
          }
          const patched = applied.find((item) => item.mode !== 'prompt' && item.seq === node.seq)
          if (patched) return nodes[patched.seq] || node
          return node
        })
        const nextGroupAt = new Map()
        for (const group of groups) {
          for (let index = group.startIndex; index <= group.endIndex; index += 1) nextGroupAt.set(index, group)
        }
        const nextUnits = buildToneUnits(nextSurface)
        const nextToneAt = (index) => {
          const node = nextSurface[index]
          if (!node) return 'normal'
          const group = nextGroupAt.get(index)
          if (!group) return 'keep'
          if (group.locked) return nextTones[node.seq] || 'keep'
          return nextTones[node.seq] || 'normal'
        }
        const segments = []
        for (const group of groups) {
          for (const segment of segmentsForGroup(group, nextSurface, nextToneAt, nextUnits)) {
            if (segment.tone !== 'keep') segments.push(segment)
          }
        }
        return { applied, unchanged, nextSurface, nextTones, segments }
      }

      function adoptAppliedEdits(data) {
        setUndoStack([])
        const { applied, unchanged, nextSurface, nextTones } = projectionAfterEdits(data)
        const removeKeys = new Set()
        for (const item of applied) {
          if (item.mode === 'prompt') removeKeys.add(editKeyFor('prompt', item.seq))
          else removeKeys.add(editKeyFor(item.mode, item.seq, item.blockIndex))
        }
        for (const item of unchanged) {
          removeKeys.add(item.mode === 'prompt'
            ? editKeyFor('prompt', item.seq)
            : editKeyFor(item.mode, item.seq, item.blockIndex))
        }
        setSurface(nextSurface)
        setTones(nextTones)
        setGroups((current) => current.map((group) => {
          const next = { ...group }
          const start = nextSurface[next.startIndex]
          const end = nextSurface[next.endIndex]
          if (start && end) next.id = `${start.seq}-${end.seq}`
          return next
        }))
        setEdits((current) => current.filter((edit) => !removeKeys.has(edit.key)))
        setDetails({})
        setMessages({})
        setEditing(null)
        setBanner({ kind: 'edit', count: applied.length, unchanged: unchanged.length, backupFile: data.backupFile || '' })
        if (data.lastSeq !== undefined) {
          setState((current) => current ? {
            ...current,
            lastSeq: data.lastSeq,
            surfaceTokens: nextSurface.filter((node) => node.role !== 'system').reduce((sum, node) => sum + (Number.isFinite(node.tokens) ? node.tokens : 0), 0),
          } : current)
        }
        if (applied.length > 0) showToast(tr('edit.applied', { count: applied.length }))
        resyncConversation(sessionId)
      }

      async function submitEdits() {
        if (edits.length === 0) {
          showToast(tr('edit.noPending'))
          return
        }
        if (busySession) {
          showToast(tr('edit.busy'))
          return
        }
        setApplyingEdits(true)
        setErrorText('')
        try {
          const data = await applyMessageEdits(sessionId, state ? state.lastSeq : -1, edits.map((edit) => ({
            seq: edit.seq,
            mode: edit.mode,
            text: edit.text,
            ...(edit.mode !== 'prompt' ? { blockIndex: edit.blockIndex, kind: edit.kind } : {}),
          })))
          adoptAppliedEdits(data)
          if (Array.isArray(data.applied) && data.applied.length === 0 && Array.isArray(data.unchanged) && data.unchanged.length > 0) {
            showToast(tr('edit.unchangedCount', { count: data.unchanged.length }))
          }
        } catch (error) {
          const payload = error && error.payload ? error.payload : null
          if (payload && Array.isArray(payload.applied) && payload.applied.length > 0) {
            adoptAppliedEdits({ ...payload, nodes: {}, lastSeq: state ? state.lastSeq : -1 })
            setErrorText(tr('edit.partial', { done: payload.applied.length, total: edits.length }))
          } else {
            // Known host codes (busy/stale/tool-pair/...) get localized copy;
            // unknown codes keep the host prose inside the localized wrapper.
            setErrorText(hostErrorText(error, 'edit') || tr('edit.failedApply', { error: rawErrorMessage(error) }))
          }
        } finally {
          setApplyingEdits(false)
        }
      }

      function openCompression() {
        setCompressOpen(true)
        setCompressChecked(false)
        setCompressTarget('direct')
        setCompressMethod(canCurated ? 'curated' : (canOfficial ? 'official' : 'curated'))
      }

      function closeCompression() {
        setCompressOpen(false)
        setCompressChecked(false)
      }

      async function commitEditsForCompression() {
        return applyMessageEdits(sessionId, state ? state.lastSeq : -1, edits.map((edit) => ({
          seq: edit.seq,
          mode: edit.mode,
          text: edit.text,
          ...(edit.mode !== 'prompt' ? { blockIndex: edit.blockIndex, kind: edit.kind } : {}),
        })))
      }

      async function confirmCompression() {
        if (!compressChecked || !canConfirmCompression) return
        setCompacting(true)
        setErrorText('')
        let focus = null
        let editDataForCompression = null
        let opsSegments = compressSegments
        try {
          let lastSeq = state ? state.lastSeq : -1
          if (compressTarget === 'modified') {
            const editData = await commitEditsForCompression()
            editDataForCompression = editData
            lastSeq = typeof editData.lastSeq === 'number' ? editData.lastSeq : lastSeq
            if (compressMethod === 'curated') {
              // The prompt replacement nodes get new seqs, so the ranges chosen
              // before applying edits no longer address the same surface.
              opsSegments = projectionAfterEdits(editData).segments
              if (opsSegments.length === 0) {
                adoptAppliedEdits(editData)
                setCompressOpen(false)
                showToast(tr('compress.nothing'))
                return
              }
            }
          }
          if (compressMethod === 'official') {
            const result = await compactContext(sessionId, lastSeq)
            if (!result.compacted) {
              showToast(tr('compress.nothing'))
              return
            }
            // The host's summarySeq is log-only; replacementSeq is the new
            // surface node, so prefer it for auto-focusing after compaction.
            focus = typeof result.replacementSeq === 'number'
              ? result.replacementSeq
              : (typeof result.summarySeq === 'number' ? result.summarySeq : null)
            setBanner({
              kind: 'compress',
              mode: 'compact',
              count: Array.isArray(result.shadowedSeqs) ? result.shadowedSeqs.length : 0,
              backupFile: result.backupFile || '',
            })
            showToast(tr('compress.doneOfficial', { count: Array.isArray(result.shadowedSeqs) ? result.shadowedSeqs.length : 0 }))
          } else {
            const ops = opsSegments.map((segment) => ({
              kind: 'summary',
              startSeq: segment.startSeq,
              endSeq: segment.endSeq,
              tone: segment.tone,
            }))
            let result
            try {
              result = await applyPlan(sessionId, lastSeq, ops, '', {
                autoSummarize: true,
                textOnly: summaryTextOnly,
              })
            } catch (error) {
              if (!error || error.code !== 'missing-summary') throw error
              // Host 0.4.0 has no auto-summary in /apply but still serves
              // /summarize; write the same summaries explicitly and retry.
              const withText = []
              for (const segment of opsSegments) {
                const data = await draftSummaryLegacy(sessionId, segment, summaryTextOnly)
                withText.push({
                  kind: 'summary',
                  startSeq: segment.startSeq,
                  endSeq: segment.endSeq,
                  tone: segment.tone,
                  text: data.text,
                })
              }
              result = await applyPlan(sessionId, lastSeq, withText, '')
            }
            const count = result && Array.isArray(result.applied) ? result.applied.length : 0
            focus = result && Array.isArray(result.applied) && result.applied.length > 0 ? result.applied[0].replacementSeq : null
            setBanner({ kind: 'compress', mode: 'curated', count, backupFile: result.backupFile || '' })
            showToast(tr('compress.doneCurated', { count }))
          }
          setCompressOpen(false)
          cancelPendingDraftWrite()
          clearDraft(sessionId)
          protectedDraftRef.current = false
          setFocusSeq(focus)
          await load()
          resyncConversation(sessionId)
        } catch (error) {
          const payload = error && error.payload ? error.payload : null
          const partialApplied = payload && Array.isArray(payload.applied) ? payload.applied.length : 0
          const editsCommitted = editDataForCompression && Array.isArray(editDataForCompression.applied)
            ? editDataForCompression.applied.length
            : 0
          let message
          if (partialApplied > 0) {
            message = tr('apply.partial', { done: partialApplied, total: opsSegments.length })
          } else {
            // Map known host codes (busy/stale/cancelled/...) to localized copy.
            message = hostErrorText(error, 'compress') || tr('compress.failed', { error: rawErrorMessage(error) })
          }
          // Any partial write leaves the on-screen surface stale: reload even
          // for direct compression (which commits no edits first).
          if (partialApplied > 0 || editsCommitted > 0) await load()
          setErrorText(message)
          setCompressOpen(false)
        } finally {
          setCompacting(false)
        }
      }

      react.useEffect(() => {
        if (phase !== 'ready' || focusSeq === null) return
        const index = surface.findIndex((node) => node.seq === focusSeq)
        if (index < 0) {
          setFocusSeq(null)
          return
        }
        const group = groups.find((candidate) => index >= candidate.startIndex && index <= candidate.endIndex)
        setFocusSeq(null)
        if (!group) return
        const key = rangeKeyOf(group)
        if (details[key] === undefined) fetchDetail(group)
      }, [phase, focusSeq, surface, groups, details])

      // Modal keyboard semantics: Escape closes, Tab stays inside the dialog,
      // and the dialog receives initial focus (its h3 names it via
      // aria-labelledby on the layer below).
      function onDialogKeyDown(event) {
        if (event.key === 'Escape') {
          event.stopPropagation()
          onClose()
          return
        }
        if (event.key !== 'Tab') return
        const root = event.currentTarget
        const focusables = Array.from(root.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ))
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (event.shiftKey && (document.activeElement === first || !root.contains(document.activeElement))) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
      react.useEffect(() => {
        if (docked) return
        const node = panelRef.current
        if (node && typeof node.focus === 'function') {
          try {
            node.focus({ preventScroll: true })
          } catch {}
        }
      }, [docked])

      const header = jsxs('div', {
        className: 'dshcurate-head',
        children: [
          jsx('div', {
            className: 'dshcurate-head-main',
            children: jsxs('div', {
              className: 'dshcurate-title-row',
              children: [
                jsx('h3', { id: titleId, className: 'dshcurate-title', children: tr('panel.title') }),
                jsx('button', {
                  type: 'button',
                  className: 'dshcurate-help',
                  title: tr('panel.help'),
                  'aria-label': tr('panel.help'),
                  onClick: () => setHelpOpen((value) => !value),
                  children: '?',
                }),
              ],
            }),
          }),
          jsx('button', {
            type: 'button',
            className: 'dshcurate-icon',
            // Refresh stays usable while a load is in flight: load() supersedes
            // the previous request instead of racing it.
            disabled: applyingEdits || compacting,
            title: tr('panel.refresh'),
            'aria-label': tr('panel.refresh'),
            onClick: load,
            children: '↻',
          }),
          jsx('button', {
            type: 'button',
            className: 'dshcurate-icon',
            title: tr('panel.close'),
            'aria-label': tr('panel.close'),
            onClick: onClose,
            children: '×',
          }),
        ],
      })

      const helpPopover = helpOpen
        ? jsxs('div', {
            className: 'dshcurate-help-pop',
            children: [
              jsx('p', { children: tr('panel.subtitle') }),
              jsx('p', { children: tr('scope.note') }),
              jsx('p', { children: tr('view.note') }),
              jsx('p', { children: tr('edit.entryHint') }),
            ],
          })
        : null

      const versionBanner = (versionIssue || patchUnavailable) && phase === 'ready'
        ? jsxs('div', {
            className: 'dshcurate-version-banner',
            children: [
              jsx('span', {
                className: 'grow',
                children: versionIssue
                  ? (hostVersion === ''
                      ? tr('version.missing')
                      : tr('version.mismatch', { host: hostVersion, client: PLUGIN_VERSION }))
                  : tr('version.patchOff'),
              }),
              jsx('button', {
                type: 'button',
                onClick: () => {
                  try {
                    window.location.reload()
                  } catch {}
                },
                children: tr('version.reload'),
              }),
            ],
          })
        : null

      const bannerView = banner !== null
        ? jsxs('div', {
            className: 'dshcurate-banner',
            children: [
              jsx('b', {
                children: banner.kind === 'edit'
                  ? tr('edit.applied', { count: banner.count })
                  : (banner.mode === 'compact'
                      ? tr('compress.doneOfficial', { count: banner.count })
                      : tr('compress.doneCurated', { count: banner.count })),
              }),
              banner.kind === 'edit' && banner.unchanged > 0
                ? jsx('span', { children: ` ${tr('edit.unchangedCount', { count: banner.unchanged })}` })
                : null,
              banner.backupFile !== ''
                ? jsx('div', { className: 'path', children: banner.kind === 'edit' ? tr('edit.backup', { path: banner.backupFile }) : tr('compress.backup', { path: banner.backupFile }) })
                : null,
            ],
          })
        : null

      const draftNoticeView = draftNotice === ''
        ? null
        : jsx('div', { className: 'dshcurate-banner', children: draftNotice })

      const compressPanel = compressOpen
        ? jsxs('div', {
            className: 'dshcurate-compress',
            children: [
              jsx('h4', { children: tr('compress.title') }),
              jsxs('div', {
                className: 'dshcurate-compress-group',
                children: [
                  jsx('div', { className: 'dshcurate-compress-label', children: tr('compress.target') }),
                  jsxs('label', {
                    className: `dshcurate-option${compressTarget === 'direct' ? ' active' : ''}`,
                    children: [
                      jsx('input', {
                        type: 'radio',
                        name: 'dshcurate-compress-target',
                        checked: compressTarget === 'direct',
                        disabled: compacting,
                        onChange: () => setCompressTarget('direct'),
                      }),
                      jsxs('div', {
                        children: [
                          jsx('div', { className: 't', children: tr('compress.target.direct') }),
                          jsx('div', {
                            className: 'd',
                            children: tr('compress.target.direct.hint')
                              + (edits.length > 0 ? ` ${tr('compress.target.direct.pending', { count: edits.length })}` : ''),
                          }),
                        ],
                      }),
                    ],
                  }),
                  jsxs('label', {
                    className: `dshcurate-option${compressTarget === 'modified' ? ' active' : ''}${edits.length === 0 ? ' disabled' : ''}`,
                    children: [
                      jsx('input', {
                        type: 'radio',
                        name: 'dshcurate-compress-target',
                        checked: compressTarget === 'modified',
                        disabled: compacting || edits.length === 0,
                        onChange: () => setCompressTarget('modified'),
                      }),
                      jsxs('div', {
                        children: [
                          jsx('div', { className: 't', children: tr('compress.target.modified') }),
                          jsx('div', {
                            className: 'd',
                            children: edits.length > 0
                              ? tr('compress.target.modified.hint', { count: edits.length })
                              : tr('compress.target.modified.none'),
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              jsxs('div', {
                className: 'dshcurate-compress-group',
                children: [
                  jsx('div', { className: 'dshcurate-compress-label', children: tr('compress.method') }),
                  jsxs('label', {
                    className: `dshcurate-option${compressMethod === 'curated' ? ' active' : ''}${canCurated ? '' : ' disabled'}`,
                    children: [
                      jsx('input', {
                        type: 'radio',
                        name: 'dshcurate-compress-method',
                        checked: compressMethod === 'curated',
                        disabled: !canCurated,
                        onChange: () => setCompressMethod('curated'),
                      }),
                      jsxs('div', {
                        children: [
                          jsx('div', { className: 't', children: tr('compress.curated') }),
                          jsx('div', {
                            className: 'd',
                            children: canCurated
                              ? tr('compress.curated.hint', { count: compressSegments.length, messages: totalMessages })
                              : (busySession ? tr('panel.busy') : tr('compress.curated.unavailable')),
                          }),
                        ],
                      }),
                    ],
                  }),
                  jsxs('label', {
                    className: `dshcurate-option${compressMethod === 'official' ? ' active' : ''}${canOfficial ? '' : ' disabled'}`,
                    children: [
                      jsx('input', {
                        type: 'radio',
                        name: 'dshcurate-compress-method',
                        checked: compressMethod === 'official',
                        disabled: !canOfficial,
                        onChange: () => setCompressMethod('official'),
                      }),
                      jsxs('div', {
                        children: [
                          jsx('div', { className: 't', children: tr('compress.official') }),
                          jsx('div', {
                            className: 'd',
                            children: canOfficial
                              ? tr('compress.official.hint') + (summaryTextOnly ? ` ${tr('compress.official.textOnly')}` : '')
                              : (busySession ? tr('panel.busy') : tr('compress.official.unavailable')),
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              compressMethod === 'curated' && canCurated
                ? jsx('div', {
                    className: 'dshcurate-note',
                    children: tr('confirm.body', { count: compressSegments.length, messages: totalMessages })
                      + (keptMessages > 0 ? ` ${tr('confirm.keep', { kept: keptMessages })}` : ''),
                  })
                : null,
              jsx('div', {
                className: 'dshcurate-note',
                children: summaryTextOnly ? tr('summary.source.text') : tr('summary.source.all'),
              }),
              jsx('label', {
                children: [
                  jsx('input', {
                    type: 'checkbox',
                    checked: compressChecked,
                    onChange: (event) => setCompressChecked(event.target.checked),
                  }),
                  jsx('span', { children: tr('compress.irreversible') }),
                ],
              }),
              jsxs('div', {
                className: 'dshcurate-compress-foot',
                children: [
                  jsx('button', { type: 'button', className: 'dshcurate-btn', onClick: closeCompression, disabled: compacting, children: tr('compress.cancel') }),
                  jsx('button', {
                    type: 'button',
                    className: 'dshcurate-btn danger',
                    disabled: !compressChecked || !canConfirmCompression,
                    onClick: confirmCompression,
                    children: compacting ? tr('compress.running') : tr('compress.confirm'),
                  }),
                ],
              }),
            ],
          })
        : null

      let body
      if (phase === 'loading') {
        body = jsx('div', { className: 'dshcurate-empty', children: tr('panel.loading') })
      } else if (phase === 'error') {
        body = jsxs('div', {
          className: 'dshcurate-empty',
          children: [
            jsx('div', { children: tr('error.state', { error: errorText }) }),
            jsx('button', { type: 'button', className: 'dshcurate-btn', onClick: load, children: tr('panel.retry') }),
          ],
        })
      } else if (groups.length === 0 && tailNode === null && !compressOpen && banner === null) {
        body = jsx('div', { className: 'dshcurate-empty', children: tr('panel.empty') })
      } else {
        const cards = groups.map((group) => jsx(GroupCard, {
          group,
          surface,
          cwd: state ? state.cwd : '',
          disabled: applyingEdits || busySession,
          edits,
          messages,
          busy: applyingEdits || compacting || busySession || messageBusy > 0,
          editing,
          textOnlyView,
          segments: segmentsOfGroup(group),
          groupTone: groupToneOf(segmentsOfGroup(group)),
          onGroupTone: (tone) => setGroupTone(group, tone),
          onNodeTone: setNodeTone,
          toneOfNode: (node) => {
            const index = surface.findIndex((candidate) => candidate.seq === node.seq)
            return index >= 0 ? toneAt(index) : 'keep'
          },
          toneDisabledForNode: (node) => {
            const index = surface.findIndex((candidate) => candidate.seq === node.seq)
            return !groupAt.has(index)
          },
          canMerge: groups[groups.length - 1] !== group,
          onSplit: () => onSplit(group),
          onMerge: () => onMerge(group),
          detail: detailOf(group),
          detailLoading: detailBusy === rangeKeyOf(group) && detailBusy !== '',
          onLoadDetail: () => toggleDetail(group),
          onCloseDetail: () => toggleDetail(group),
          onEdit: openEditor,
          onEditSnippet: (node) => editFromPreview(group, node),
          onUndo: (node) => undoEditsForNode(node.seq),
          onLoadFull: loadFull,
          onValue: setEditorValue,
          onEditorMode: setEditorMode,
          onBlock: setEditorBlock,
          onBlockConfirm: confirmBlockSwitch,
          onBlockCancel: cancelBlockSwitch,
          onCancel: cancelEditor,
          onSave: saveEditor,
        }, group.id))
        const tailEdits = tailNode && Array.isArray(edits) ? edits.filter((edit) => edit.seq === tailNode.seq) : []
        const tailVisible = tailNode !== null && isConversationNode(tailNode, textOnlyView)
        const tail = tailNode
          ? jsxs('div', {
              className: 'dshcurate-card locked',
              children: [
                jsxs('div', {
                  className: 'dshcurate-card-meta',
                  children: [
                    jsx('b', { children: tr('tail.badge') }),
                    jsx('span', { children: ` · #${tailNode.seq}` }),
                    tailEdits.length > 0 ? jsx('span', { className: 'dshcurate-badge edit', children: tr('footer.pending', { count: tailEdits.length }) }) : null,
                  ],
                }),
                tailVisible
                  ? jsx(MessageDetail, {
                      node: tailNode,
                      full: messages[tailNode.seq] ? messages[tailNode.seq] : null,
                      nodeEdits: tailEdits,
                      editing: editing && editing.seq === tailNode.seq ? editing : null,
                      cwd: state ? state.cwd : '',
                      busy: applyingEdits || compacting || busySession,
                      textOnlyView,
                      showTone: false,
                      onEdit: openEditor,
                      onUndo: (node) => undoEditsForNode(node.seq),
                      onLoadFull: loadFull,
                      onValue: setEditorValue,
                      onMode: setEditorMode,
                      onBlock: setEditorBlock,
                      onBlockConfirm: confirmBlockSwitch,
                      onBlockCancel: cancelBlockSwitch,
                      onCancel: cancelEditor,
                      onSave: saveEditor,
                    })
                  : jsx('div', { className: 'dshcurate-note', children: tr('tail.hidden') }),
              ],
            })
          : null
        body = jsxs('div', {
          children: [
            versionBanner,
            draftNoticeView,
            bannerView,
            busySession
              ? jsx('div', { className: 'dshcurate-alert', role: 'status', 'aria-live': 'polite', children: tr('panel.busy') })
              : null,
            errorText !== ''
              ? jsx('div', { className: 'dshcurate-alert', role: 'alert', children: errorText })
              : null,
            compressPanel,
            ...cards,
            tail,
            toast !== ''
              ? jsx('div', { className: 'dshcurate-toast', role: 'status', 'aria-live': 'polite', children: toast })
              : null,
          ].filter(Boolean),
        })
      }

      const stats = jsxs('div', {
        className: 'dshcurate-stats',
        children: [
          jsx('span', { children: tr('stats.surface', { tokens: fmtTokens(surfaceTokens) }) }),
          jsx('span', { children: tr('stats.selected', { count: selected.length, tokens: fmtTokens(selectedTokens) }) }),
          jsx('span', { children: tr('stats.after', { tokens: fmtTokens(afterTokens) }) }),
          jsx('span', { children: jsx('b', { children: tr('stats.saved', { tokens: fmtTokens(Math.max(0, surfaceTokens - afterTokens)) }) }) }),
          edits.length > 0 ? jsx('span', { children: jsx('b', { children: tr('footer.pending', { count: edits.length }) }) }) : null,
        ],
      })
      const scope = jsxs('div', {
        className: 'dshcurate-scope',
        children: [
          jsx('span', { children: tr('scope.title') }),
          jsx('select', {
            value: preserveTurns,
            'aria-label': tr('scope.title'),
            disabled: applyingEdits || compacting,
            onChange: changePreserve,
            children: [0, 1, 2, 3, 4, 5, 6].map((value) => jsx('option', { value, children: `${value} ${tr('scope.suffix')}` }, value)),
          }),
          jsxs('div', {
            className: 'dshcurate-view',
            children: [
              jsx('button', {
                type: 'button',
                className: textOnlyView ? '' : 'active',
                'aria-pressed': textOnlyView ? 'false' : 'true',
                onClick: () => changeTextOnlyView(false),
                children: tr('view.all'),
              }),
              jsx('button', {
                type: 'button',
                className: textOnlyView ? 'active' : '',
                'aria-pressed': textOnlyView ? 'true' : 'false',
                onClick: () => changeTextOnlyView(true),
                children: tr('view.text'),
              }),
            ],
          }),
          jsxs('label', {
            className: 'dshcurate-flag',
            children: [
              jsx('input', {
                type: 'checkbox',
                checked: summaryTextOnly,
                onChange: (event) => changeSummaryTextOnly(event.target.checked),
              }),
              jsx('span', { children: tr('summary.textOnly') }),
            ],
          }),
          jsx('span', { className: 'grow' }),
        ],
      })
      const footer = phase === 'ready'
        ? jsxs('div', {
            className: 'dshcurate-foot',
            children: [
              jsx('button', {
                type: 'button',
                className: `dshcurate-btn${edits.length > 0 ? ' primary' : ''}`,
                disabled: !canApplyEdits,
                title: edits.length > 0 ? tr('edit.hint') : tr('edit.noPending'),
                onClick: submitEdits,
                children: applyingEdits ? tr('edit.loading') : (edits.length > 0 ? tr('footer.applyEdits') : tr('footer.apply')),
              }),
              jsx('button', {
                type: 'button',
                className: 'dshcurate-btn',
                disabled: applyingEdits || compacting,
                title: busySession ? tr('panel.busy') : undefined,
                onClick: () => {
                  if (busySession) {
                    showToast(tr('panel.busy'))
                    return
                  }
                  openCompression()
                },
                children: compacting ? tr('compress.running') : tr('footer.compress'),
              }),
              jsx('button', {
                type: 'button',
                className: 'dshcurate-btn',
                disabled: applyingEdits || compacting,
                onClick: saveDraftNow,
                children: tr('footer.save'),
              }),
              jsx('button', {
                type: 'button',
                className: 'dshcurate-btn',
                disabled: undoStack.length === 0,
                onClick: undoLast,
                children: tr('footer.undo'),
              }),
              jsx('span', { className: 'spacer' }),
              jsx('span', {
                className: 'note',
                children: busySession
                  ? tr('panel.busy')
                  : edits.length > 0
                    ? tr('footer.pending', { count: edits.length })
                    : selected.length === 0
                      ? tr('footer.nothing')
                      : '',
              }),
              jsx('span', { className: 'note', children: tr('version.label', { version: PLUGIN_VERSION }) }),
            ],
          })
        : null

      const panel = jsxs('div', {
        ref: panelRef,
        className: 'dshcurate-panel',
        tabIndex: -1,
        'aria-labelledby': docked ? undefined : titleId,
        children: [header, helpPopover, stats, scope, jsx('div', { className: 'dshcurate-body', ref: bodyRef, children: body }), footer].filter(Boolean),
      })
      if (docked) {
        return jsx('div', {
          className: 'dshcurate-dock',
          'aria-label': tr('panel.title'),
          onKeyDown: onDialogKeyDown,
          children: panel,
        })
      }
      return jsxs('div', {
        className: 'dshcurate-layer',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': titleId,
        onKeyDown: onDialogKeyDown,
        onMouseDown: (event) => {
          if (event.target === event.currentTarget) onClose()
        },
        children: [panel],
      })
    }

    function ModalShell(props) {
      const sessionId = props.sessionId
      const workbench = useWorkbenchState(sessionId)
      if (!workbench.open) return null
      return jsx(Workbench, { sessionId, onClose: () => closeWorkbench(sessionId) })
    }

    function HeaderEntry(props) {
      useLocaleTick()
      return jsx('button', {
        type: 'button',
        className: 'dshcurate-open',
        title: tr('action.title'),
        onClick: () => {
          if (openCurateTab !== null) {
            try {
              if (openCurateTab() === true) return
            } catch (error) {
              console.error('[dsh-curate] opening the curation tab failed:', error)
            }
          }
          openWorkbench(props.sessionId)
        },
        children: tr('action.open'),
      })
    }

    // --- plugin --------------------------------------------------------------

    function apply(ctx) {
      clientCtx = ctx
      const disposeStyles = ensureStyles()
      try {
        document.documentElement.dataset.dshCurateVersion = PLUGIN_VERSION
      } catch {}
      try {
        if (ctx.locale && typeof ctx.locale.register === 'function') {
          ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-curate: dictionaries')
        }
      } catch (error) {
        console.error('[dsh-curate] locale registration failed:', error)
      }
      // Host locale switches must re-render the workbench body, not only the
      // sidebar tab title. Prefer the locale service's subscription; fall back
      // to the documented locale/change event on older compositions.
      try {
        if (ctx.locale && typeof ctx.locale.subscribe === 'function') {
          ctx.effect(() => ctx.locale.subscribe(() => publishLocaleChange()), 'dsh-curate: locale refresh')
        } else if (typeof ctx.on === 'function') {
          ctx.effect(() => ctx.on('locale/change', () => publishLocaleChange()), 'dsh-curate: locale refresh')
        }
      } catch (error) {
        console.error('[dsh-curate] locale refresh subscription failed:', error)
      }

      ctx.slots.inject('conversation.session.header.actions', () =>
        ctx.slots.register(
          {
            name: 'conversation.session.header.actions',
            id: 'dsh-curate-open',
            order: 12,
            locale: NS,
            inject: (sessionId) => ({ sessionId }),
          },
          HeaderEntry,
        ),
      )
      ctx.slots.inject('conversation.input.overlay', () =>
        ctx.slots.register(
          {
            name: 'conversation.input.overlay',
            id: 'dsh-curate',
            order: 11,
            locale: NS,
            inject: (sessionId) => ({ sessionId }),
          },
          ModalShell,
        ),
      )

      // The approved UI seat: a tab in the official right Sidebar. The body is
      // the same workbench; the header entry simply opens the tab.
      ctx.effect(
        () =>
          ctx.inject(['sidebarRightTabs'], (sidebarCtx) => {
            const disposers = []
            const t = typeof sidebarCtx.locale?.bind === 'function' ? sidebarCtx.locale.bind(NS) : (key) => key
            let service = null
            try {
              service = sidebarCtx.get('sidebarRight')
            } catch {
              service = null
            }
            const usable = service !== null && service !== undefined && typeof service.openTab === 'function'
            try {
              if (sidebarCtx.sidebarRightTabs !== undefined && sidebarCtx.sidebarRightTabs !== null &&
                  typeof sidebarCtx.sidebarRightTabs.register === 'function') {
                disposers.push(sidebarCtx.sidebarRightTabs.register({
                  id: TAB_KIND,
                  kind: TAB_KIND,
                  title: () => t('tab.title'),
                }))
              }
            } catch (error) {
              console.error('[dsh-curate] sidebar tab type registration failed:', error)
            }
            try {
              const Body = (props) => jsx(Workbench, {
                sessionId: props.sessionId,
                onClose: () => dockedCloseTab(),
                docked: true,
              })
              disposers.push(sidebarCtx.slots.inject('sidebar.right.pane.tab', () => sidebarCtx.slots.register(
                {
                  name: 'sidebar.right.pane.tab',
                  key: TAB_KIND,
                  locale: NS,
                  inject: (sessionId) => ({ sessionId }),
                },
                Body,
              )))
              disposers.push(sidebarCtx.slots.inject('sidebar.right.pane.tab.title', () => sidebarCtx.slots.register(
                { name: 'sidebar.right.pane.tab.title', key: TAB_KIND, locale: NS },
                (props) => {
                  const tt = typeof props.t === 'function' ? props.t : t
                  return jsx('span', { children: tt('tab.title') })
                },
              )))
            } catch (error) {
              console.error('[dsh-curate] sidebar tab body registration failed:', error)
            }
            if (usable) {
              openCurateTab = () => {
                service.openTab(TAB_KIND)
                return true
              }
              closeCurateTab = () => {
                try {
                  const active = typeof service.active === 'function' ? service.active() : undefined
                  if (active !== null && active !== undefined && typeof active.id === 'string') service.close(active.id)
                } catch (error) {
                  console.error('[dsh-curate] closing the curation tab failed:', error)
                }
              }
            }
            return () => {
              openCurateTab = null
              closeCurateTab = null
              for (const dispose of disposers) {
                try {
                  if (typeof dispose === 'function') dispose()
                } catch {}
              }
            }
          }),
        'dsh-curate: sidebar tab',
      )

      // Plugin unload / HMR: remove the stylesheet and the version marker so a
      // reloaded instance starts clean.
      return () => {
        try {
          if (typeof disposeStyles === 'function') disposeStyles()
        } catch {}
        try {
          delete document.documentElement.dataset.dshCurateVersion
        } catch {}
      }
    }

    // Tests only: the pure pieces have no Cordis dependency.
    exports.__internals = {
      buildGroups,
      middleCut,
      markdownToHtml,
      sanitizeMarkdownHtml,
      htmlToMarkdown,
      resolveRenderedImages,
      MarkdownEditor,
      MessageEditor,
      MessageDetail,
      isConversationNode,
      buildToneUnits,
      estimatedSummaryTokens,
      segmentsForGroup,
      groupToneOf,
      GroupCard,
      Workbench,
      HeaderEntry,
      editKeyFor,
      hostErrorText,
      normalizePreserveTurns,
      draftHasContent,
      readDraft,
      writeDraft,
      DETAIL_PAGE_SIZE,
    }
    exports.apply = apply
    exports.inject = ['slots', 'locale']
    exports.PLUGIN_VERSION = PLUGIN_VERSION
    return module.exports
  },
})
