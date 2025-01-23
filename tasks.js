/**
 * Copyright 2018-2024 bluefox <dogafox@gmail.com>
 *
 * MIT License
 *
 **/
'use strict';

const { existsSync, copyFileSync } = require('node:fs');
const { deleteFoldersRecursive, npmInstall, buildReact, copyFiles, patchHtmlFile } = require('@iobroker/build-tools');

async function copyAllFiles() {
    deleteFoldersRecursive(`${__dirname}/admin`);

    copyFiles(['src-admin/build/**/*', '!src-admin/build/index.html'], 'admin/');
    copyFileSync('src-admin/build/index.html', 'admin/tab.html');
    await patchHtmlFile('admin/tab.html');
}

if (process.argv.includes('--0-clean')) {
    deleteFoldersRecursive(`${__dirname}/admin`);
    deleteFoldersRecursive(`${__dirname}/src-admin/build`);
} else if (process.argv.includes('--1-npm')) {
    if (!existsSync(`${__dirname}/src-admin/node_modules`)) {
        npmInstall(`${__dirname}/src-admin`).catch(e => {
            console.log(`Error: ${e.toString()}`);
            process.exit(2);
        });
    }
} else if (process.argv.includes('--3-build')) {
    buildReact(`${__dirname}/src-admin`, { rootDir: `${__dirname}/src-admin`, vite: true }).catch(e => {
        console.log(`Error: ${e.toString()}`);
        process.exit(2);
    });
} else if (process.argv.includes('--4-copy')) {
    copyAllFiles().catch(e => {
        console.log(`Error: ${e.toString()}`);
        process.exit(2);
    });
} else {
    deleteFoldersRecursive(`${__dirname}/admin`);
    deleteFoldersRecursive(`${__dirname}/src-admin/build`);
    let npm;
    if (!existsSync(`${__dirname}/src-admin/node_modules`)) {
        npm = npmInstall(`${__dirname}/src-admin`).catch(e => {
            console.log(`Error: ${e.toString()}`);
            process.exit(2);
        });
    } else {
        npm = Promise.resolve();
    }
    npm.then(() => buildReact(`${__dirname}/src-admin`, { rootDir: `${__dirname}/src-admin`, vite: true }))
        .then(() => copyAllFiles())
        .catch(e => {
            console.log(`Error: ${e.toString()}`);
            process.exit(2);
        });
}
