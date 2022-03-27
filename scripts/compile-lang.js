const child_process = require('child_process');
const fs = require('fs');
const path = require('path');

const cwd = path.resolve(__dirname, '..')

function dumpLang() {
    console.log('Dumping lang');
    const yarn = child_process.spawnSync('yarn', ['extract', 'src/**/*.ts*', '--ignore="**/*.d.ts"', '--out-file', 'lang/en.json'], { cwd, shell: true, stdio: 'pipe' });
    if (yarn.error) {
        const npm = child_process.spawnSync('npm', ['run', 'extract', 'src/**/*.ts*', '--ignore="**/*.d.ts"', '--out-file', 'lang/en.json'], { cwd, shell: true, stdio: 'pipe' });
        if (yarn.error) {
            console.log(yarn.error);
            console.log(npm.error);
            throw new Error('Failed to extract lang');
        } else if (npm.status !== 0) {
            process.stdout.write(yarn.stdout);
            process.stderr.write(yarn.stderr);
            throw new Error('Failed to extract lang');
        }
    } else if (yarn.status !== 0) {
        process.stdout.write(yarn.stdout);
        process.stderr.write(yarn.stderr);
        throw new Error('Failed to extract lang');
    }
}

function mergeLang(fromFileName, toFileName) {
    console.log('Merging lang: ' + fromFileName + ' to ' + toFileName);
    const from = path.resolve(cwd, 'lang', fromFileName);
    const to = path.resolve(cwd, 'lang', toFileName);
    const fromLang = JSON.parse(fs.readFileSync(from, 'utf8'));
    const toLang = JSON.parse(fs.readFileSync(to, 'utf8'));
    for (const key in fromLang) {
        if (!(key in toLang)) {
            toLang[key] = fromLang[key];
        }
    }
    fs.writeFileSync(to, JSON.stringify(toLang, null, 2));
}

function mergeLangs() {
    const langDir = path.resolve(cwd, 'lang');
    const langs = fs.readdirSync(langDir);
    langs.forEach(lang => {
        if (lang !== 'en.json') {
            mergeLang('en.json', lang);
        }
    });
}

function compileLang(langFileName) {
    console.log('Compiling lang: ' + langFileName);
    const yarn = child_process.spawnSync('yarn', ['compile', 'lang/' + langFileName, '--ast', '--out-file', 'compiled-lang/' + langFileName], { cwd, shell: true, stdio: 'pipe' });
    if (yarn.error) {
        const npm = child_process.spawnSync('npm', ['run', 'compile', 'lang/' + langFileName, '--ast', '--out-file', 'compiled-lang/' + langFileName], { cwd, shell: true, stdio: 'pipe' });
        if (npm.error) {
            console.log(yarn.error);
            console.log(npm.error);
            throw new Error('Failed to compile lang');
        } else if (npm.status !== 0) {
            process.stdout.write(yarn.stdout);
            process.stderr.write(yarn.stderr);
            throw new Error('Failed to compile lang');
        }
    } else if (yarn.status !== 0) {
        process.stdout.write(yarn.stdout);
        process.stderr.write(yarn.stderr);
        throw new Error('Failed to compile lang');
    }
}

function compileLangs() {
    const langDir = path.resolve(cwd, 'lang');
    const langs = fs.readdirSync(langDir);
    if (!fs.existsSync(path.resolve(cwd, 'compiled-lang'))) {
        fs.mkdirSync(path.resolve(cwd, 'compiled-lang'));
    }
    langs.forEach(lang => {
        compileLang(lang);
    });
}

function main() {
    dumpLang()
    mergeLangs()
    compileLangs()
}

main()
