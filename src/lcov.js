const lcov = "./parse-lcov/index"

const parse = (data) =>
  new Promise((resolve, reject) =>
    resolve(lcov.parseLCOV(data))

    // TODO: Support proper promise semantics

    // lcov(data, (err, res) => {
    //   if (err) {
    //     reject(err);
    //     return;
    //   }
    //   resolve(res);
    // })
  );

const percentage = (lcovData) => {
  let hit = 0;
  let found = 0;

  lcovData.forEach((entry) => {
    hit += entry.lines.hit;
    found += entry.lines.found;
  });

  return ((hit / found) * 100).toFixed(2);
};

const getUncoveredFilesLines = (lcovData) => {
  const response = [];

  lcovData.forEach((fileData) => {
    const lines = fileData.lines.details
      .filter(({ hit }) => hit === 0)
      .map(({ line }) => line);

    if (lines.length > 0) {
      response.push({
        file: fileData.file,
        lines
      });
    }
  });

  return response;
};

const getGroupedUncoveredFileLines = (filesLines) =>
  filesLines.map(({ file, lines }) => {
    const groupedLines = [];
    let previousLine = null;
    let startLine = null;

    const pushCurrentStateToArray = () =>
      groupedLines.push(
        startLine !== previousLine ? [startLine, previousLine] : previousLine
      );

    // eslint-disable-next-line no-restricted-syntax
    for (const line of lines) {
      // initialize first element
      if (startLine === null) {
        startLine = line;
        previousLine = line;
        // eslint-disable-next-line no-continue
        continue;
      }

      /// group elements to range
      if (previousLine !== line - 1) {
        pushCurrentStateToArray();
        startLine = line;
      }

      previousLine = line;
    }

    // Push last element
    pushCurrentStateToArray();

    return { file, lines: groupedLines };
  });

const uncoveredFileLinesByFileNames = (fileNames, lcovData) => {
  const uncoveredFileLines = getUncoveredFilesLines(
    lcovData
  ).filter(({ file }) => fileNames.includes(file));

  const groupedUncoveredFileLines = getGroupedUncoveredFileLines(
    uncoveredFileLines
  );

  return groupedUncoveredFileLines;
};

module.exports = {
  parse,
  percentage,
  getUncoveredFilesLines,
  getGroupedUncoveredFileLines,
  uncoveredFileLinesByFileNames
};
