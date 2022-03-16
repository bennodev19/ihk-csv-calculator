import { readFilesFromDir, writeCSV } from './file';

const inputConfig = {
  dirPath: './files/input',
};
const outputConfig = {
  path: './files/output',
  fileName: 'analytics',
};

async function main(): Promise<void> {
  // Read to import csv files
  const parsedIHKData = await readFilesFromDir(inputConfig.dirPath, {
    delimiter: ',',
  });

  // Format data
  let formattedIHKData: IHKData[] = [];
  for (const fileName of Object.keys(parsedIHKData)) {
    const toFormatData = parsedIHKData[fileName];
    if (toFormatData != null) {
      formattedIHKData = formattedIHKData.concat(
        toFormatData.map((data) => ({
          name: data['Name'],
          part: data['Part'],
          season: data['Season'],
          year: data['Year'],
          specifiedTopics: data['SpecifiedTopic'].split(', '),
          topic: data['Topic'],
        })),
      );
    }
  }

  // Get total exam count (to calculate percentage)
  let totalExamCount = 0;
  const examKeys: string[] = [];
  for (const ihkData of formattedIHKData) {
    const examKey = `${ihkData.year} | ${ihkData.season}`;
    if (!examKeys.includes(examKey)) {
      examKeys.push(examKey);
      totalExamCount += 1;
    }
  }

  // Build topic analytics array
  const topicAnalytics: TopicAnalytics[] = [];
  for (const ihkData of formattedIHKData) {
    let specifiedTopicNames = ihkData.specifiedTopics;

    // Extract specified topics like 'Question' or 'Basic-Math'
    const specificTopics = ['Question', 'Basic-Math'];
    let specificTopic: string | null = null;
    for (let i = 0; i < specificTopics.length; i++) {
      if (specifiedTopicNames.includes(specificTopics[i])) {
        specificTopic = specificTopics[i];
        break;
      }
    }

    // Handle specified topics
    if (specificTopic != null) {
      specifiedTopicNames = specifiedTopicNames.filter(
        (v) => v !== specificTopic,
      );
      if (specifiedTopicNames.length > 0) {
        specifiedTopicNames = [
          `${specificTopic}: ${specifiedTopicNames.reduce(function (
            prevVal,
            currVal,
            index,
          ) {
            return index == 0 ? currVal : prevVal + ', ' + currVal;
          },
          '')}`,
        ];
      } else {
        specifiedTopicNames = [`${specificTopic}: ${ihkData.topic}`];
      }
    }

    // Handle special case 'Struktogramm/Pseudocode'
    if (
      specifiedTopicNames.includes('Struktogramm') &&
      specifiedTopicNames.includes('Pseudocode')
    ) {
      specifiedTopicNames = ['Struktogramm/Pseudocode'];
    }

    // Map topic name to topic analytics
    for (const specifiedTopicName of specifiedTopicNames) {
      // Check if the Topic already tracked
      const foundAnalyticItem = topicAnalytics.find(
        (d) => d.name === specifiedTopicName,
      );

      // Create analytics Item
      let analyticItem: TopicAnalytics;
      if (foundAnalyticItem == null) {
        analyticItem = {
          name: specifiedTopicName,
          relatedTasks: [],
          relatedYears: [],
          // isQuestion,
          topic: ihkData.topic,
          count: 0,
          probability: 'unknown',
        };
        topicAnalytics.push(analyticItem);
      } else {
        analyticItem = foundAnalyticItem;
      }

      // Add Topic to the analytics Item
      analyticItem.relatedYears.push(ihkData.year);
      analyticItem.relatedTasks.push(`${ihkData.name} [${ihkData.part}]`);
      analyticItem.count += 1;
      analyticItem.probability = `${(
        (analyticItem.count / totalExamCount) *
        100
      ).toFixed(2)}%`;
    }
  }

  // Write analytics to a new csv file
  await writeCSV(outputConfig.fileName, outputConfig.path, topicAnalytics);
}

console.log('Info: Start Program');
main().then(() => {
  console.log('Info: End Program');
});

type IHKData = {
  name: string;
  part: string;
  season: string;
  year: string;
  specifiedTopics: string[];
  topic: string;
};

type TopicAnalytics = {
  name: string;
  relatedTasks: string[];
  relatedYears: string[];
  // isQuestion: boolean;
  topic: string;
  count: number;
  probability: string; // in %
};
