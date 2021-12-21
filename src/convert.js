import { decode } from "https://deno.land/std@0.118.0/encoding/base64.ts";
import yaml from "https://cdn.skypack.dev/yaml?dts";

// 程序入口
const textDecoder = new TextDecoder();
if (import.meta.main) {
  // 订阅地址 多个地址用;隔开
  // sub_url = 'https://sub.realnode.co/api/v1/client/subscribe?token=2a8af2bb714193430496542651bf0f01'
  // sub_url='https://dogess.app/link/keRblm3EcRyTsawT?clash=1'
  const sub_url =
    "https://raw.githubusercontent.com/chfchf0306/jeidian4.18/main/4.18;https://sub.realnode.co/api/v1/client/subscribe?token=2a8af2bb714193430496542651bf0f01";
  // 输出路径
  const output_path = "./output.yaml";
  // 规则策略
  const config_path = "src/clash.yaml";

  if (sub_url === "") {
    Deno.exit();
  }

  const node_list = await get_proxies(sub_url);
  //console.log(node_list);
  const functionault_config = await get_functionault_config(config_path);
  const final_config = add_proxies_to_model(node_list, functionault_config);
  await save_config(output_path, final_config);
  // console.log(`文件已导出至 ${config_path}`);
}
// 获取订阅地址数据:
async function get_proxies(urls) {
  const url_list = urls.split(";");
  const headers = {
    "User-Agent": "Rule2",
    "accept":
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
  };
  const proxy_list = {
    "proxy_list": [],
    "proxy_names": [],
  };
  // 请求订阅地址
  for (const url of url_list) {
    const response = await fetch(url, { headers: headers });
    const text = await response.text();
    //console.log("url -text -content:.....");
    //console.log(text);
    // const filename = new Date().toISOString().substring(0, 10) + ".txt";
    //await Deno.writeTextFile(filename, text);
    // const text = await Deno.readTextFile(filename);
    const raw = decode(text);
    const decode_text = textDecoder.decode(raw);
    //console.log(decode_text);
    // 加载clash节点
    //     raw = base64.b64decode(response)
    // except Exception as r:
    //     log('base64解码失败:{},应当为clash节点'.format(r))
    //     log('clash节点提取中...')
    //     yml = yaml.load(response, Loader=yaml.FullLoader)
    //     nodes_list = []
    //     tmp_list = []
    //     // clash新字段
    //     if yml.get('proxies'):
    //         tmp_list = yml.get('proxies')
    //     // clash旧字段
    //     elif yml.get('Proxy'):
    //         tmp_list = yml.get('Proxy')
    //     else:
    //         log('clash节点提取失败,clash节点为空')
    //         continue
    //     for node in tmp_list:
    //         node['name'] = node['name'].strip(
    //         ) if node.get('name') else None
    //         // 对clashR的支持
    //         if node.get('protocolparam'):
    //             node['protocol-param'] = node['protocolparam']
    //             del node['protocolparam']
    //         if node.get('obfsparam'):
    //             node['obfs-param'] = node['obfsparam']
    //             del node['obfsparam']
    //         node['udp'] = True
    //         nodes_list.append(node)
    //     node_names = [node.get('name') for node in nodes_list]
    //     log('可用clash节点{}个'.format(len(node_names)))
    //     proxy_list['proxy_list'].extend(nodes_list)
    //     proxy_list['proxy_names'].extend(node_names)
    //     continue
    const nodes_list = decode_text.split("\n");
    for (const node of nodes_list) {
      if (node.startsWith("vmess://")) {
        const decode_proxy = decode_v2ray_node(node);
        while (proxy_list["proxy_names"].includes(decode_proxy.name)) {
          decode_proxy.name = decode_proxy.name + "_2";
        }
        //console.log(decode_proxy.name)
        proxy_list["proxy_list"].push(decode_proxy);
        proxy_list["proxy_names"].push(decode_proxy.name);
      } else if (node.startsWith("ss://")) {
        //const decode_proxy = decode_ss_node([node]);
        //clash_node = ss_to_clash(decode_proxy);
      } else if (node.startsWith("ssr://")) {
        //const decode_proxy = decode_ssr_node([node]);
        //clash_node = ssr_to_clash(decode_proxy);
      } else {
        continue;
      }
    }
  }

  //         for name, proxy in zip(clash_node['proxy_names'], clash_node['proxy_list']):
  //             if name not in proxy_list['proxy_names']:
  //                 proxy_list['proxy_names'].append(name)
  //                 proxy_list['proxy_list'].append(proxy)
  //         }        }
  // log('共发现:{}个节点'.format(len(proxy_list['proxy_names'])))
  //console.log(proxy_list);

  return proxy_list;
}

// 说明 : 本脚本提供解析v2ray/ss/ssr/clashR/clashX订阅链接为Clash配置文件,仅供学习交流使用.
// function log(msg) {
//   time = datetime.datetime.now();
//   print("[" + time.strftime("%Y.%m.%d-%H:%M:%S") + "] " + msg);
// }

// 保存到文件
// function save_to_file(filename, content) {
//   await Deno.writeTextFile(filename, content);
// }

// 针对url的base64解码
// function safe_decode(s) {
//   const num = len(s) % 4;
//   if (num) {
//     s += "=" * (4 - num);
//   }
//   return atob(s);
// }

// 解析vmess节点
function decode_v2ray_node(node) {
  const decode_proxy = decode(node.slice(8));
  const proxy_str = textDecoder.decode(decode_proxy);
  //console.log(proxy_str);
  const proxy = JSON.parse(proxy_str);

  //console.log(proxy);

  const name = `${proxy["ps"].trim() || ""}:${proxy["port"]}`;
  const obj = {
    "name": name,
    "type": "vmess",
    "server": proxy["add"],
    "port": Number(proxy["port"]),
    "uuid": proxy["id"],
    "alterId": proxy["aid"],
    "cipher": "auto",
    "udp": true,
    // 'network': item['net'] if item['net'] and item['net'] != 'tcp' else None,
    "network": proxy["net"],
    "tls": proxy["tls"] === "tls" ? true : null,
    "ws-path": proxy["path"],
    "ws-headers": proxy["host"] ? { "Host": proxy["host"] } : null,
  };
  // for key in list(obj.keys()):
  // if obj.get(key) is None:
  //   del obj[key]
  // if obj.get('alterId') is not None:
  // proxies['proxy_list'].append(obj)
  // proxies['proxy_names'].append(obj['name'])
  //console.log(obj);
  return obj;
}

// v2ray转换成Clash节点
// function v2ray_to_clash(arr):
//     //log('v2ray节点转换中...')
//     proxies = {
//         'proxy_list': [],
//         'proxy_names': []
//     }
//     for item in arr:

//     log('可用v2ray节点{}个'.format(len(proxies['proxy_names'])))
//     return proxies

// 解析ss节点
// function decode_ss_node(nodes){
//     proxy_list = []
//     for (let node of nodes){
//         decode_proxy = node.decode('utf-8')[5:]
//         if not decode_proxy or decode_proxy.isspace():
//             log('ss节点信息为空，跳过该节点')
//             continue
//         info = dict()
//         param = decode_proxy
//         if param.find('//') > -1:
//             remark = urllib.parse.unquote(param[param.find('//') + 1:])
//             info['name'] = remark
//             param = param[:param.find('//')]
//         if param.find('/?') > -1:
//             plugin = urllib.parse.unquote(param[param.find('/?') + 2:])
//             param = param[:param.find('/?')]
//             for p in plugin.split(';'):
//                 key_value = p.split('=')
//                 info[key_value[0]] = key_value[1]
//         if param.find('@') > -1:
//             matcher = re.match(r'(.*?)@(.*):(.*)', param)
//             if matcher:
//                 param = matcher.group(1)
//                 info['server'] = matcher.group(2)
//                 info['port'] = matcher.group(3)
//             else:
//                 continue
//             matcher = re.match(
//                 r'(.*?):(.*)', safe_decode(param).decode('utf-8'))
//             if matcher:
//                 info['method'] = matcher.group(1)
//                 info['password'] = matcher.group(2)
//             else:
//                 continue
//         else:
//             matcher = re.match(r'(.*?):(.*)@(.*):(.*)',
//                                safe_decode(param).decode('utf-8'))
//             if matcher:
//                 info['method'] = matcher.group(1)
//                 info['password'] = matcher.group(2)
//                 info['server'] = matcher.group(3)
//                 info['port'] = matcher.group(4)
//             else:
//                 continue
//         proxy_list.append(info)
//             }
//     return proxy_list

// // 解析ssr节点
// function decode_ssr_node(nodes):
//     proxy_list = []
//     for node in nodes:
//         decode_proxy = node.decode('utf-8')[6:]
//         if not decode_proxy or decode_proxy.isspace():
//             log('ssr节点信息为空，跳过该节点')
//             continue
//         proxy_str = safe_decode(decode_proxy).decode('utf-8')
//         parts = proxy_str.split(':')
//         if len(parts) != 6:
//             print('该ssr节点解析失败，链接:{}'.format(node))
//             continue
//         info = {
//             'server': parts[0],
//             'port': parts[1],
//             'protocol': parts[2],
//             'method': parts[3],
//             'obfs': parts[4]
//         }
//         password_params = parts[5].split('/?')
//         info['password'] = safe_decode(password_params[0]).decode('utf-8')
//         params = password_params[1].split('&')
//         for p in params:
//             key_value = p.split('=')
//             info[key_value[0]] = safe_decode(key_value[1]).decode('utf-8')
//         proxy_list.append(info)
//     return proxy_list

// // ss转换成Clash节点
// function ss_to_clash(arr):
//     log('ss节点转换中...')
//     proxies = {
//         'proxy_list': [],
//         'proxy_names': []
//     }
//     for item in arr:
//         name = f"{item.get('name') or ''}:{item.get('port')}"
//         obj = {
//             'name': name,
//             'type': 'ss',
//             'server': item.get('server'),
//             'port': int(item.get('port')),
//             'cipher': item.get('method'),
//             'password': item.get('password'),
//             'plugin': 'obfs' if item.get('plugin') and item.get('plugin').startswith('obfs') else None,
//             'plugin-opts': {} if item.get('plugin') else None
//         }
//         if item.get('obfs'):
//             obj['plugin-opts']['mode'] = item.get('obfs')
//         if item.get('obfs-host'):
//             obj['plugin-opts']['host'] = item.get('obfs-host')
//         for key in list(obj.keys()):
//             if obj.get(key) is None:
//                 del obj[key]
//         proxies['proxy_list'].append(obj)
//         proxies['proxy_names'].append(obj['name'])
//     log('可用ss节点{}个'.format(len(proxies['proxy_names'])))
//     return proxies

// // ssr转换成Clash节点
// function ssr_to_clash(arr):
//     log('ssr节点转换中...')
//     proxies = {
//         'proxy_list': [],
//         'proxy_names': []
//     }
//     for item in arr:
//         name = f"{item.get('remarks').strip() or ''}:{item.get('port')}"

//         obj = {
//             'name': name,
//             'type': 'ssr',
//             'server': item.get('server'),
//             'port': int(item.get('port')),
//             'cipher': item.get('method'),
//             'password': item.get('password'),
//             'obfs': item.get('obfs'),
//             'protocol': item.get('protocol'),
//             'obfs-param': item.get('obfsparam'),
//             'protocol-param': item.get('protoparam'),
//             'udp': True
//         }
//         for key in list(obj.keys()):
//             if obj.get(key) is None:
//                 del obj[key]
//         if obj.get('name'):
//             if not obj['name'].startswith('剩余流量') and not obj['name'].startswith('过期时间'):
//                 proxies['proxy_list'].append(obj)
//                 proxies['proxy_names'].append(obj['name'])
//     log('可用ssr节点{}个'.format(len(proxies['proxy_names'])))
//     return proxies

// // 获取本地规则策略的配置文件
// function load_local_config(path):
//     try:
//         f = open(path, 'r', encoding="utf-8")
//         local_config = yaml.load(f.read(), Loader=yaml.FullLoader)
//         f.close()
//         return local_config
//     except FileNotFoundError:
//         log('配置文件加载失败')
//         sys.exit()

// 获取规则策略的配置文件
async function get_functionault_config(path) {
  const txt = await Deno.readTextFile(path);
  const template_config = yaml.parse(txt);

  //console.log(yaml.stringify({ foo: "bar", baz: ["qux", "quux"] }) );
  return template_config;
}
// 将代理添加到配置文件
function add_proxies_to_model(data, model) {
  if (model["proxies"]) {
   model["proxies"] = model["proxies"].concat(data["proxy_list"]);
  } else {
    model["proxies"] = data["proxy_list"];
  }

  for (const group of model["proxy-groups"]) {
    if (group["proxies"]) {
     group["proxies"] = group["proxies"].concat(data["proxy_names"]);
    } else {
      group["proxies"] = data["proxy_names"];
    }
  }
  return model;
}
// 保存配置文件
async function save_config(path, data) {
  //console.log(data);
  const config = yaml.stringify(data);
  //console.log(config);
  await Deno.writeTextFile(path, config);
  //log('成功更新{}个节点'.format(len(data['proxies'])))
}
