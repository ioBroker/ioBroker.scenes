/**
 * Copyright 2018-2026 bluefox <dogafox@gmail.com>
 *
 * MIT License
 *
 **/
'use strict';

const { existsSync, copyFileSync } = require('node:fs');
const { deleteFoldersRecursive, npmInstall, buildReact, copyFiles, patchHtmlFile } = require('@iobroker/build-tools');

const SRC_DEVICES = 'src-devices/';
const srcDevices = `${__dirname}/${SRC_DEVICES}`;

function cleanDevices() {
    deleteFoldersRecursive(`${srcDevices}build`);
    deleteFoldersRecursive(`${__dirname}/admin/dm-widgets`);
}

function copyAllFilesDevices() {
    copyFiles([`${SRC_DEVICES}build/customDevices.js`], `admin/dm-widgets`);
    copyFiles([`${SRC_DEVICES}build/assets/*.*`], `admin/dm-widgets/assets`);
    copyFiles([`${SRC_DEVICES}build/img/*`], `admin/dm-widgets/img`);
    copyFiles([`${SRC_DEVICES}img/scenes.png`], `admin/dm-widgets`);
}

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
        .then(() => cleanDevices())
        .then(() => npmInstall(srcDevices))
        .then(() => buildReact(srcDevices, { rootDir: __dirname, vite: true }))
        .then(() => copyAllFilesDevices())
        .catch(e => {
            console.log(`Error: ${e.toString()}`);
            process.exit(2);
        });
}
