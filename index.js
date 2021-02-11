const fs = require("fs");
const chalk = require("chalk");
const sharp = require("sharp");
const path = require("path");

const error = chalk.bold.red;
const warning = chalk.keyword("orange");

main();

function main() {
  asciiArt();
}

function asciiArt() {
  const cliArgs = process.argv.slice(2);

  if (!cliArgs.length) {
    printWarning(
      "Program did not receive any arguments. To learn more, use the --help command."
    );
  }
  if (cliArgs[0] === "--help" || cliArgs[0] === "-h") {
    printHelp();
  }
  if (cliArgs[0] === "---file" || cliArgs[0] === "-f") {
    let file;

    try {
      file = path.resolve(__dirname, cliArgs[1]);
    } catch (err) {
      printError(err);
    }

    fs.access(file, fs.F_OK, (err) => {
      if (err) {
        printError(err);
      }

      const image = sharp(file);

      image
        .raw()
        .toBuffer({ resolveWithObject: true })
        .then(({ data, info }) => {
          // can loop through data
          // format is r g b r g b r g b until it ends

          const { width } = info;
          const pixel2d = pixel2dArray(data, width);
          const ascii2d = ascii2dArray(pixel2d);

          console.log("Your image here.");

          ascii2d.forEach((row) => {
            console.log(row.join(''));
          });
        });
    });
  }
}

function printHelp() {
  console.log(
    `
    node index.js --file <argument>          Do the thing with this file
    node index.js --help                     Prints this
    `
  );
  process.exit();
}

function printWarning(message) {
  console.log(warning(message));
  process.exit();
}

function printError(message) {
  console.log(error(message));
  process.exit();
}

function pixel2dArray(data, width) {
  const pixels = [[]];
  let currHeight = 0;
  let currPixel = [];

  for (var i = 0; i < data.length; i++) {
    if (pixels[currHeight].length === width) {
      pixels.push([]);
      currHeight++;
    }
    currPixel.push(data[i]);
    if (currPixel.length === 3) {
      pixels[currHeight].push(currPixel);
      currPixel = [];
    }
  }

  return pixels;
}

function calcBrightnessMatrix(pixelData) {
  if (pixelData.length !== 3) {
    printError(
      `calcBrightnessMatrix: pixelData should be an array with 3 elements.`
    );
  }

  const [r, g, b] = pixelData;

  return Math.round((r + g + b) / 3);
}

function calcAsciiMatrix(pixelData) {
  const brightness = calcBrightnessMatrix(pixelData);
  const theAscii =
    '`^",:;Il!i~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';
  const brightnessForEachCharacter = 255 / theAscii.length;

  const score = Math.round(brightness / brightnessForEachCharacter);
  if (score > 0) {
    return theAscii[score - 1];
  }
  return theAscii[0];
}

function ascii2dArray(data) {
  const ret = [];

  for (let i = 0; i < data.length; i++) {
    const rowData = [];
    for (let j = 0; j < data[i].length; j++) {
      rowData.push(calcAsciiMatrix(data[i][j]));
    }
    ret.push(rowData);
  }

  return ret;
}
