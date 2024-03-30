import * as readline from "readline";

const promptUser = (question: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

export default promptUser;
// Path: src/utils/promptUser.ts