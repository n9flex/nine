


/*
Options:
    -h, --help        Show the help message
    -s, --search      The search string (Open SSH)
    -v, --version     The version string (2.5.5)
    -sV --version-all Service Version Detection
    -ip, --address    The IP address to target
    -p, --port        The port number
*/

let search = '';
let version = '';
let ipAddress = '';
let port = '';
let versionScan = false;
let h = false;
const usage = 'Options (-h) (-sV) (-v <2.5.5>) (-s <OpenSSH>) (-ip <ip address>) (-p <port>)';

await requireTool('metasploit').then(r => {
    println(`${r}`);
}).catch(e => println(`${e}`));

const metasploit = GetMetasploit();
const args = Shell.GetArgs()

for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
        case '-h':
        case '--help':
        case '?':
            h = true;
            println(usage);
            break;

        case '-s':
        case '--search':
            search = args[i + 1];
            i++;
            break;
        
        case '-v':
        case '--version':
            version = args[i + 1];
            i++;
            break;

        case '-ip':
        case '--address':
            ipAddress = args[i + 1];
            i++;
            break;

        case '-p':
        case '--port':
            port = args[i + 1];
            i++;
            break;

        case '-sV':
        case '--version-all':
            versionScan = true;
            break;
            
        default:
            break;
    }
}

if (!search && !ipAddress && !h) {
    throw new Error('Error: You must provide a search term or an IP. Use -h for usage');
}

if (versionScan) {
    searchVersion(ipAddress);
} else if (search || ipAddress || port || version) {
    msf(search, ipAddress, port, version)
} else {
    throw new Error('Error: You must provide an IP, Port, and Search Term');
}

function msf(search: string, ipAddress: string, port: string, version: string) {
    metasploit.Search(search).then(async r => {
        r.forEach((obj, index) => {
            const row = Object.entries(obj)
                .map(([key, value]) => `${key}:${value}`)
                .join(" ");

            println(`#${index} ${row}`);
        });

        const id = await prompt('Choose by #: ');
        await metasploit.Use(`${r[id].name}`);
        await metasploit.SetOption('RHOST', `${ipAddress}`)
        await metasploit.SetOption('RPORT', `${port}`)
        await metasploit.SetOption('Version', `${version}`)
        metasploit.Exploit();
    })
}

function searchVersion(ip) {
    Shell.Process.exec(`nmap ${ip} -sV`);
}

function requireTool(tool: string) {
    return new Promise(async (resolve, reject) => {
        println(`Checking if ${tool} is installed`);
        const installed = checkLib(`${tool}`);
        if (!installed) {
            println(`${tool} is not installed, attempting to install now...`);
            const toolInstall = await installLib(`${tool}`);
            if (toolInstall) {
                resolve(`${tool} has been installed.`);
            } else {
                reject(`Unkown Error while installing ${tool}`);
            }
        }
        resolve(`${tool} is installed..`);
    })
}