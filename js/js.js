
(function () {
  const output    = document.getElementById('output');
  const input     = document.getElementById('cmd-input');
  const cwdLabel  = document.getElementById('cwd-label');
  const cwdStatus = document.getElementById('cwd-status');
  const timeStatus = document.getElementById('time-status');
  const pidVal    = document.getElementById('pid-val');

  let cwd     = '~';
  let history = [];
  let histIdx = -1;
  let exitCode = 0;

  pidVal.textContent = Math.floor(Math.random() * 9000 + 1000);

  function clock() {
    timeStatus.textContent = new Date().toTimeString().slice(0, 8);
  }
  setInterval(clock, 1000);
  clock();

  function addLine(html, cls = '', delay = 0) {
    return new Promise(res => {
      setTimeout(() => {
        const d = document.createElement('div');
        d.className = 'line ' + cls;
        d.innerHTML = html;
        output.appendChild(d);
        output.scrollTop = output.scrollHeight;
        res(d);
      }, delay);
    });
  }

  function ps1(dir) {
    return `<span class="ps1-user">user</span><span class="ps1-at">@</span><span class="ps1-host">phantom</span><span class="ps1-at">:</span><span class="ps1-path">${esc(dir)}</span><span class="ps1-dollar"> $</span>`;
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function matrixText(text, cls = 'output') {
    const html = text.split('').map((c, i) =>
      `<span class="matrix-char" style="animation-delay:${i * 18}ms">${esc(c)}</span>`
    ).join('');
    addLine(html, cls);
  }

  async function progressLine(label, delay = 0) {
    await addLine(
      `<span style="color:var(--text-dim)">${esc(label)}</span> ` +
      `<div class="progress-bar" style="width:200px;display:inline-block;vertical-align:middle">` +
      `<div class="progress-fill"></div></div> ` +
      `<span style="color:var(--green);font-size:11px">OK</span>`,
      'output', delay
    );
  }

  /* ── Boot sequence ── */
  const bootLines = [
    { t: '<span style="color:var(--green);font-weight:700">PHANTOM OS</span> <span style="color:var(--text-dim)">v4.2.0-arch1-1 — Terminal Emulator</span>', c: 'dim' },
    { t: 'Copyright (c) 2024 phantom-systems. All rights reserved.', c: 'dim' },
    { t: '', c: 'dim' },
    { t: '[ OK ] Kernel: Linux 6.7.9-arch1', c: 'success' },
    { t: '[ OK ] CPU: AMD Ryzen 9 7950X (32) @ 5.085GHz', c: 'success' },
    { t: '[ OK ] Memory: 64GiB DDR5 @ 6000MHz', c: 'success' },
    { t: '[ OK ] GPU: NVIDIA GeForce RTX 4090', c: 'success' },
    { t: '', c: 'dim' },
    { t: 'Bienvenido. Escribe <span style="color:var(--amber)">help</span> para ver los comandos disponibles.', c: 'info' },
    { t: '', c: 'dim' },
  ];

  async function showBoot() {
    for (let i = 0; i < bootLines.length; i++) {
      await addLine(bootLines[i].t, bootLines[i].c, i * 55);
    }
    await new Promise(r => setTimeout(r, bootLines.length * 55 + 100));
    printPrompt();
  }

  function printPrompt() {
    addLine(ps1(cwd), 'prompt-line');
  }

  /* ── Virtual filesystem ── */
  const fs = {
    '~':             ['Documents', 'Downloads', 'Pictures', 'src', '.bashrc', '.vimrc', 'README.md'],
    '~/Documents':   ['informe_q3.pdf', 'notas.txt', 'proyecto.docx'],
    '~/Downloads':   ['arch-linux.iso', 'nmap-7.94.tar.gz', 'wallpaper.png'],
    '~/src':         ['kernel-module', 'phantom-cli', 'web-scraper'],
    '~/Pictures':    ['screenshot.png', 'avatar.jpg', 'wallpapers'],
  };

  /* ── Command handlers ── */
  const cmds = {

    help: async () => {
      const items = [
        ['ls [-la]',       'listar archivos del directorio'],
        ['cd [dir]',       'cambiar directorio'],
        ['pwd',            'mostrar directorio actual'],
        ['cat [archivo]',  'mostrar contenido de archivo'],
        ['echo [texto]',   'imprimir texto'],
        ['clear',          'limpiar pantalla'],
        ['whoami',         'mostrar usuario actual'],
        ['uname -a',       'info del sistema'],
        ['ps aux',         'procesos activos'],
        ['df -h',          'uso de disco'],
        ['free -h',        'memoria disponible'],
        ['top',            'monitor de procesos'],
        ['uptime',         'tiempo activo del sistema'],
        ['ping [host]',    'ping a host'],
        ['curl [url]',     'petición HTTP'],
        ['date',           'fecha y hora'],
        ['history',        'historial de comandos'],
        ['neofetch',       'info del sistema con arte ASCII'],
        ['matrix',         'modo matrix'],
        ['tree',           'estructura de directorios'],
        ['exit',           'cerrar sesión'],
      ];
      await addLine('<span style="color:var(--cyan);font-weight:700">Comandos disponibles:</span>', 'info');
      for (const [cmd, desc] of items) {
        await addLine(
          `  <span style="color:var(--green);display:inline-block;min-width:190px">${esc(cmd.padEnd(20))}</span>` +
          `<span style="color:var(--text-dim)">${esc(desc)}</span>`,
          'output'
        );
      }
    },

    ls: async (args) => {
      const files = fs[cwd] || fs['~'];
      if (args.includes('-la') || args.includes('-l')) {
        await addLine('<span style="color:var(--text-dim)">total 48</span>', 'output');
        for (const f of files) {
          const isDir = !f.includes('.');
          const p = isDir ? 'drwxr-xr-x' : '-rw-r--r--';
          const size = Math.floor(Math.random() * 9000 + 100);
          const h = String(Math.floor(Math.random() * 24)).padStart(2, '0');
          const m = String(Math.floor(Math.random() * 60)).padStart(2, '0');
          const name = isDir
            ? `<span style="color:var(--cyan);font-weight:700">${f}</span>`
            : `<span style="color:var(--text)">${f}</span>`;
          await addLine(
            `<span style="color:var(--text-dim)">${p}  1 user user ${String(size).padStart(6)} may 26 ${h}:${m} </span>${name}`,
            'output'
          );
        }
      } else {
        const parts = files.map(f => {
          if (!f.includes('.')) return `<span style="color:var(--cyan);font-weight:700">${f}/</span>`;
          if (f.endsWith('.sh') || f.endsWith('.py')) return `<span style="color:var(--green)">${f}*</span>`;
          return `<span style="color:var(--text)">${f}</span>`;
        });
        await addLine(parts.join('  '), 'output');
      }
    },

    pwd: async () => {
      await addLine(`/home/user${cwd === '~' ? '' : cwd.slice(1)}`, 'output');
    },

    cd: async (args) => {
      const dest   = args.trim() || '~';
      const target = dest === '..'
        ? '~'
        : dest.startsWith('~') ? dest : `${cwd}/${dest}`;
      if (fs[target] !== undefined || target === '~') {
        cwd = target;
        cwdLabel.textContent  = cwd;
        cwdStatus.textContent = cwd + '/';
      } else {
        await addLine(`bash: cd: ${esc(dest)}: No such file or directory`, 'error');
        exitCode = 1;
      }
    },

    cat: async (args) => {
      if (!args.trim()) {
        await addLine('bash: cat: falta nombre de archivo', 'error');
        return;
      }
      const demos = {
        '.bashrc': [
          '# ~/.bashrc — Phantom OS shell configuration',
          'export PS1="\\[\\e[32m\\]\\u@\\h\\[\\e[0m\\]:\\[\\e[33m\\]\\w\\[\\e[0m\\]$ "',
          'alias ll="ls -la"',
          'alias grep="grep --color=auto"',
          'export PATH="$HOME/.local/bin:$PATH"',
          'export EDITOR=nvim',
        ],
        '.vimrc': ['set number', 'set tabstop=2', 'syntax on', 'colorscheme gruvbox'],
        'README.md': [
          '# phantom-os',
          '',
          'Sistema operativo minimalista de alto rendimiento.',
          '',
          '## Requisitos',
          '- Linux 6.x+',
          '- 4GB RAM mín.',
        ],
        'notas.txt': [
          'TODO:',
          '- Revisar configuración de red',
          '- Actualizar paquetes',
          '- Hacer backup de /etc',
        ],
      };
      const content = demos[args.trim()];
      if (content) {
        for (const l of content) await addLine(esc(l), 'output');
      } else {
        await addLine(`cat: ${esc(args.trim())}: No such file or directory`, 'error');
        exitCode = 1;
      }
    },

    echo: async (args) => { await addLine(esc(args), 'output'); },

    clear: async () => { output.innerHTML = ''; },

    whoami: async () => { await addLine('user', 'output'); },

    uname: async (args) => {
      if (args.includes('-a'))
        matrixText('Linux phantom 6.7.9-arch1-1 #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux', 'output');
      else
        await addLine('Linux', 'output');
    },

    date: async () => { await addLine(new Date().toString(), 'output'); },

    uptime: async () => {
      const h = Math.floor(Math.random() * 72 + 1);
      const m = String(Math.floor(Math.random() * 60)).padStart(2, '0');
      await addLine(
        ` ${new Date().toTimeString().slice(0,8)} up ${h}:${m},  1 user,  load average: ` +
        `0.${Math.floor(Math.random()*99)}, 0.${Math.floor(Math.random()*99)}, 0.${Math.floor(Math.random()*99)}`,
        'output'
      );
    },

    free: async () => {
      await addLine('<span style="color:var(--text-dim)">               total        used        free      shared  buff/cache   available</span>', 'output');
      await addLine('<span style="color:var(--green)">Mem:</span>         <span style="color:var(--text)">64Gi       18Gi       38Gi      1.2Gi       7.8Gi       44Gi</span>', 'output');
      await addLine('<span style="color:var(--amber)">Swap:</span>        <span style="color:var(--text)">16Gi         0B       16Gi</span>', 'output');
    },

    df: async () => {
      await addLine('<span style="color:var(--text-dim)">Filesystem      Size  Used Avail Use% Mounted on</span>', 'output');
      await addLine('<span style="color:var(--text)">/dev/nvme0n1p2   512G   87G  425G  17% /</span>', 'output');
      await addLine('<span style="color:var(--text)">/dev/nvme0n1p1   511M  6.1M  505M   2% /boot</span>', 'output');
      await addLine('<span style="color:var(--text)">tmpfs             32G    0B   32G   0% /tmp</span>', 'output');
    },

    ps: async () => {
      const procs = [
        ['1',    'root', '0.0', '0.0', 'systemd'],
        ['1337', 'user', '0.2', '0.1', 'bash'],
        ['2048', 'user', '1.4', '2.3', 'node'],
        ['4096', 'user', '0.0', '0.1', 'nvim'],
        ['8192', 'root', '0.1', '0.0', 'sshd'],
        ['9001', 'user', '3.2', '4.1', 'chromium'],
      ];
      await addLine('<span style="color:var(--text-dim)">  PID USER     %CPU %MEM COMMAND</span>', 'output');
      for (const [pid, user, cpu, mem, cmd] of procs) {
        await addLine(
          `<span style="color:var(--green)">${String(pid).padStart(5)}</span> ` +
          `<span style="color:var(--text-dim)">${user.padEnd(8)} ${cpu.padStart(4)} ${mem.padStart(4)} </span>` +
          `<span style="color:var(--text)">${cmd}</span>`,
          'output'
        );
      }
    },

    top: async () => {
      await addLine(`<span style="color:var(--cyan)">top - ${new Date().toTimeString().slice(0,8)} up 47:23,  1 user,  load average: 0.42, 0.38, 0.31</span>`, 'output');
      await addLine('<span style="color:var(--text-dim)">Tasks: 287 total,   1 running, 286 sleeping</span>', 'output');
      await addLine('<span style="color:var(--text-dim)">%Cpu(s):  3.2 us,  1.1 sy,  0.0 ni, 95.4 id,  0.2 wa</span>', 'output');
      await addLine('<span style="color:var(--amber)">[Nota: simulación — usa Ctrl+C para salir en un sistema real]</span>', 'warning');
    },

    ping: async (args) => {
      const host = args.trim() || 'google.com';
      await addLine(`PING ${esc(host)} (93.184.216.34): 56 bytes de datos`, 'output');
      for (let i = 0; i < 4; i++) {
        const ms = (Math.random() * 20 + 8).toFixed(3);
        await addLine(
          `64 bytes de 93.184.216.34: icmp_seq=${i} ttl=118 time=<span style="color:var(--green)">${ms} ms</span>`,
          'output', i * 300
        );
      }
      await addLine('', 'output', 4 * 300);
      await addLine(`--- ${esc(host)} estadísticas de ping ---`, 'output', 4 * 300 + 50);
      await addLine('4 paquetes transmitidos, 4 recibidos, 0% pérdida de paquetes', 'success', 4 * 300 + 100);
    },

    curl: async (args) => {
      const url = args.trim() || 'https://example.com';
      await addLine('  % Total    % Received % Xferd  Average Speed   Time', 'dim');
      await progressLine('Conectando a ' + esc(url), 0);
      await addLine('HTTP/2 200 OK', 'success', 400);
      await addLine('content-type: text/html; charset=UTF-8', 'dim', 450);
      await addLine('server: phantom-nginx/1.24.0', 'dim', 500);
      await addLine('<span style="color:var(--text-dim)">&lt;!DOCTYPE html&gt;</span>', 'output', 600);
    },

    history: async () => {
      if (history.length === 0) {
        await addLine('(sin historial aún)', 'dim');
      } else {
        for (let i = 0; i < history.length; i++) {
          await addLine(
            `  <span style="color:var(--text-dim)">${String(i + 1).padStart(4)}</span>  ` +
            `<span style="color:var(--text)">${esc(history[i])}</span>`,
            'output'
          );
        }
      }
    },

    neofetch: async () => {
      const art = [
        '     <span style="color:var(--cyan)">     /\\     </span>',
        '     <span style="color:var(--cyan)">    /  \\    </span>',
        '     <span style="color:var(--cyan)">   / /\\ \\   </span>',
        '     <span style="color:var(--cyan)">  / ____ \\  </span>',
        '     <span style="color:var(--cyan)"> /_/    \\_\\ </span>',
      ];
      const info = [
        `<span style="color:var(--green);font-weight:700">user</span><span style="color:var(--text-dim)">@</span><span style="color:var(--green);font-weight:700">phantom</span>`,
        `<span style="color:var(--text-dim)">OS:</span>     Phantom OS x86_64`,
        `<span style="color:var(--text-dim)">Kernel:</span> Linux 6.7.9-arch1`,
        `<span style="color:var(--text-dim)">Shell:</span>  bash 5.2.15`,
        `<span style="color:var(--text-dim)">CPU:</span>    AMD Ryzen 9 7950X @ 5.085GHz`,
        `<span style="color:var(--text-dim)">GPU:</span>    NVIDIA GeForce RTX 4090 24GB`,
        `<span style="color:var(--text-dim)">Memory:</span> 18GiB / 64GiB`,
      ];
      const maxLen = Math.max(art.length, info.length);
      for (let i = 0; i < maxLen; i++) {
        const a = art[i]  || '                    ';
        const b = info[i] || '';
        await addLine(`${a}  ${b}`, 'output');
      }
      const colors = ['#ff5252','#ffb300','#00ff88','#00e5ff','#7c4dff','#ff4081'];
      const blocks  = colors.map(c => `<span style="background:${c};color:${c};padding:0 8px">██</span>`).join('');
      await addLine(`                              ${blocks}`, 'output', 100);
    },

    matrix: async () => {
      const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ01!@#$%^&*ABCDEFGHIJ';
      await addLine('<span style="color:var(--green)">Iniciando modo MATRIX... (escribe cualquier cosa para continuar)</span>', 'success');
      for (let row = 0; row < 6; row++) {
        let line = '';
        for (let col = 0; col < 60; col++) {
          const c = chars[Math.floor(Math.random() * chars.length)];
          const bright = Math.random() > 0.85;
          const g = Math.floor(Math.random() * 100 + 155);
          const a = (Math.random() * 0.6 + 0.4).toFixed(2);
          const color = bright ? '#ffffff' : `rgba(0,${g},${Math.floor(Math.random()*40)},${a})`;
          line += `<span class="matrix-char" style="color:${color};animation-delay:${(row*60+col)*8}ms;font-size:11px">${esc(c)}</span>`;
        }
        await addLine(line, 'output', row * 80);
      }
    },

    tree: async () => {
      const struct = [
        '<span style="color:var(--cyan)">/home/user</span>',
        '├── <span style="color:var(--cyan)">Documents/</span>',
        '│   ├── <span style="color:var(--text)">informe_q3.pdf</span>',
        '│   └── <span style="color:var(--text)">notas.txt</span>',
        '├── <span style="color:var(--cyan)">Downloads/</span>',
        '│   ├── <span style="color:var(--text)">arch-linux.iso</span>',
        '│   └── <span style="color:var(--text)">nmap-7.94.tar.gz</span>',
        '├── <span style="color:var(--cyan)">src/</span>',
        '│   ├── <span style="color:var(--cyan)">kernel-module/</span>',
        '│   ├── <span style="color:var(--cyan)">phantom-cli/</span>',
        '│   └── <span style="color:var(--cyan)">web-scraper/</span>',
        '├── <span style="color:var(--green)">.bashrc</span>',
        '├── <span style="color:var(--green)">.vimrc</span>',
        '└── <span style="color:var(--text)">README.md</span>',
        '',
        '<span style="color:var(--text-dim)">3 directories, 9 files</span>',
      ];
      for (let i = 0; i < struct.length; i++) {
        await addLine('<span style="color:var(--text-dim)">' + struct[i] + '</span>', 'output', i * 40);
      }
    },
  };

  /* ── Run a command ── */
  async function runCommand(raw) {
    const trimmed = raw.trim();
    if (!trimmed) { printPrompt(); return; }

    history.unshift(trimmed);
    if (history.length > 100) history.pop();
    histIdx = -1;

    const parts = trimmed.split(/\s+/);
    const cmd   = parts[0].toLowerCase();
    const args  = parts.slice(1).join(' ');

    await addLine(`${ps1(cwd)} <span style="color:var(--text)">${esc(trimmed)}</span>`, 'prompt-line');

    if (cmd === 'exit' || cmd === 'quit') {
      await addLine('<span style="color:var(--amber)">logout</span>', 'warning');
      await addLine('<span style="color:var(--text-dim)">Connection to phantom closed.</span>', 'dim');
      input.disabled = true;
      return;
    }

    const handler = cmds[cmd];
    if (handler) {
      exitCode = 0;
      await handler(args);
    } else {
      await addLine(`bash: <span style="color:var(--text)">${esc(cmd)}</span>: command not found`, 'error');
      exitCode = 127;
    }

    printPrompt();
  }

  /* ── Keyboard handling ── */
  input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      const val = input.value;
      input.value = '';
      await runCommand(val);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (histIdx < history.length - 1) { histIdx++; input.value = history[histIdx]; }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx > 0) { histIdx--; input.value = history[histIdx]; }
      else { histIdx = -1; input.value = ''; }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      output.innerHTML = '';
      printPrompt();
    }
  });

  document.getElementById('term-root').addEventListener('click', () => input.focus());

  /* ── Start ── */
  showBoot();
})();