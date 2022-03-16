import fs from 'fs';
import { parseFile, ParserOptionsArgs, writeToPath } from 'fast-csv';

export async function parseCSVFile<
  ParsedData extends TParsedCSVRows = TParsedCSVRows,
>(filepath: string, config: ParserOptionsArgs = {}): Promise<ParsedData> {
  config = { delimiter: ';', headers: true, ...config };

  console.log('Info: Start Reading File', filepath, config);

  return await new Promise<ParsedData>((resolve, reject) => {
    const data: ParsedData = [] as any;
    parseFile(filepath, config)
      .on('error', (error) => {
        console.error(error);
        reject([]);
      })
      .on('data', (row) => {
        data.push(row);
      })
      .on('end', (rowCount: number) => {
        console.log(`Parsed ${rowCount} rows`);
        resolve(data);
      });
  });
}

export const readDir = async (dirpath: string): Promise<string[]> => {
  console.log('Info: Start Reading Dir', dirpath);
  return await new Promise((resolve, reject) => {
    fs.readdir(dirpath, (err, filenames) => {
      if (err) {
        console.log('Error: Reading Dir', dirpath);
        reject(err);
      }
      console.log('Info: End Reading Dir', dirpath, filenames);
      resolve(filenames);
    });
  });
};

export async function readFilesFromDir<
  ParsedData extends TParsedCSVRows = TParsedCSVRows,
>(
  dirpath: string,
  config: ParserOptionsArgs = {},
): Promise<{ [key: string]: ParsedData }> {
  const filesObject = {};
  const filesInDir = await readDir(dirpath);

  for (const key in filesInDir) {
    const filename = filesInDir[key];
    filesObject[filename] = await parseCSVFile(
      `${dirpath}/${filename}`,
      config,
    );
  }

  return filesObject;
}

export async function writeDir(dirpath: string): Promise<void> {
  console.log('Info: Start Writing Dir', dirpath);
  return await new Promise((resolve, reject) => {
    fs.mkdir(dirpath, { recursive: true }, (err) => {
      if (err) {
        console.log('Error: Writing Dir', dirpath);
        reject(err);
      }
      console.log('Info: End Writing Dir', dirpath);
      resolve(undefined);
    });
  });
}

export async function writeCSV(
  filename: string,
  dirname: string,
  data: TParsedCSVRows,
) {
  const endPart = filename.endsWith('.csv') ? '' : '.csv';
  await writeDir(dirname);
  writeToPath(`${dirname}/${filename}${endPart}`, data, { headers: true });
}

export type TParsedCSVRows = Array<{
  [key: string]: any;
}>;
