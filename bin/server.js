'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const child_process = require('child_process');
const path = require('path');
const chalk = require('chalk');
const moment = require('moment');
const url = require('url');
const mkdirp = require('mkdirp');
const cors = require('cors');

const formatUrl = (filename) => url.format({
  hostname: 'cdn.kool.house',
  path: path.join('/scan', filename),
  protocol: 'https:'
});

const scanToNfs = (directory, filename) => new Promise((resolve, reject) => {
  const parsed = path.parse(filename);
  const scanProcess = child_process.spawn('scan.sh', [ path.join(directory, parsed.name + '.png') ]);
  console.log(chalk.cyan.bold(moment(new Date()).format('MM-DD HH:mm:ss')) + ' ' + chalk.yellow.bold('starting scan') + ' ' + chalk.magenta.bold(filename));
  console.log(chalk.bold('available at ' + chalk.magenta(formatUrl(filename))));
  scanProcess.stdout.pipe(process.stdout);
  scanProcess.stderr.pipe(process.stderr);
  scanProcess.on('exit', (code) => resolve({
    exitCode: code,
    url: formatUrl(filename)
  }));
});

const convertToPdf = (directory, filename) => new Promise((resolve, reject) => {
  const parsed = path.parse(filename);
  const subprocess = child_process.spawn('convert', [ path.join(directory, parsed.name + '.png'), '-page', 'a4', path.join(directory, parsed.name + '.pdf') ]);
  subprocess.on('exit', (exitCode) => resolve({
    exitCode
  }));
});
  

const createServer = ({
  host,
  directory,
  port
}) => {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json({ extended: true }));
  app.post('/scan', async (req, res) => {
    if (!req.body.filename) res.json({
      error: 'Must supply filename'
    });
    else {
      const parsed = path.parse(req.body.filename);
      const {
        url: resultUrl,
        exitCode
      } = await scanToNfs(directory, parsed.name);
      if (exitCode !== 0) return res.json({
        error: 'non-zero exit code'
      });
      const { exitCode: exitCodePdf } = await convertToPdf(directory, parsed.name);
      if (exitCodePdf !== 0) return res.json({
        error: 'non-zero exit code'
      });
      return res.json({
        success: {
          image: url.format({
            protocol: 'https:',
            hostname: 'cdn.kool.house',
            pathname: path.join('/scan', parsed.name + '.png')
          }),
          link: url.format({
            protocol: 'https:',
            hostname: 'cdn.kool.house',
            pathname: path.join('/scan', parsed.name + '.pdf')
          })
        }
      });
    }
  });
  return () => new Promise((resolve, reject) => app.listen(port, host, (err) => {
    if (err) return reject(err);
    resolve();
  }));
};
      
(async () => {
  const host = process.env.HOST || 'localhost';
  const port = process.env.PORT || 8080;
  const serve = createServer({
    host,
    port,
    directory: path.join(__dirname, '..', '..', 'nfs', 'scan')
  });
  await serve();
  console.log('serving');
})().catch((err) => console.error(err));
