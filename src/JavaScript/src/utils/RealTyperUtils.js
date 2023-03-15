/**
 *   RealTyper
 *
 *   A JavaScript module that gives the effect of typing for texts
 *
 *   [Doc](https://github.com/cyrus2281/Real-Typer/tree/main/src/JavaScript#readme)
 *
 *   author: Cyrus Mobini
 *
 *   Licensed under the MIT license.
 *   http://www.opensource.org/licenses/mit-license.php
 *
 *   Copyright 2023 Cyrus Mobini (https://github.com/cyrus2281)
 *
 *
 */

const sleep = (duration) =>
  new Promise((resolve) => setTimeout(resolve, duration));

const checkValues = (props) => {
  if (!(typeof props.strings === "string" || Array.isArray(props.strings))) {
    if (props.developerMode) {
      console.warn('Input string should be either a string or an array of strings');
    }
    return false;
  } else {
    if (Array.isArray(props.strings) && !(props.loopStartIndex < props.strings?.length)) {
      if (props.developerMode) {
        console.error(
          "loop start value can not be bigger than length of the strings(" +
            props.strings?.length +
            ")"
        );
      }
      return false;
    }
  }
  if (!!props.callback) {
    if (!(props.callback instanceof Function)) {
      if (props.developerMode) {
        console.error("Only a function can be assigned to callback");
      }
      return false;
    }
  }
  return true;
};

const typeString = async (
  string,
  location,
  deleteString,
  setOutput,
  typeOptions
) => {
  const { typeSpeed, deleteSpeed, holdDelay } = typeOptions;

  for (let i = location[1]; i < string.length; i++) {
    location[1] = i;
    await sleep(typeSpeed);
    setOutput(string.substring(0, i + 1));
  }

  if (deleteString) {
    await sleep(holdDelay);
    for (let i = string.length; i >= 0; i--) {
      location[1] = i;
      await sleep(deleteSpeed);
      setOutput(string.substring(0, i));
    }
  }
};

const typeLoop = async (props) => {
  const { queue, location, typeOptions, setOutput } = props;
  const {
    loop,
    loopStartIndex,
    loopHold,
    delete: deleteProp,
    deleteLastString,
    pauseDelay,
    callback,
    callbackArgs,
  } = typeOptions;

  props.isRunning = true;
  do {
    console.log(location, queue.length);
    for (let i = location[0]; i < queue.length; i++) {
      location[0] = i;
      const deleteString =
        deleteProp && (deleteLastString || i !== queue.length - 1);

      await typeString(queue[i], location, deleteString, setOutput, {
        typeSpeed: typeOptions.typeSpeed,
        deleteSpeed: typeOptions.deleteSpeed,
        holdDelay: typeOptions.holdDelay,
      });

      if (
        queue.length - 1 > location[0] &&
        queue[location[0]].length - 1 === location[1]
      ) {
        // if the string is not the last string in the queue and
        // the last character of the string is typed, clear index
        location[1] = 0;
      }
      pauseDelay && (await sleep(pauseDelay));
    }
    callback && callback(callbackArgs);
    if (loop) {
      loopHold && (await sleep(loopHold));
      location[0] = loopStartIndex;
    }
  } while (loop);
  props.isRunning = false;
};

export const realType = (typeOptions, setOutput) => {
  const { startDelay, strings, loopStartIndex, callback, developerMode } =
    typeOptions;

  if (
    !checkValues({
      strings,
      developerMode,
      loopStartIndex,
      callback,
    })
  ) {
    throw new Error("Invalid input, set developerMode to true for more info");
  }

  const initialValues = Array.isArray(strings) ? strings : [strings];

  const loopInput = {
    isRunning: true,
    queue: initialValues,
    location: [0, 0],
    typeOptions,
    setOutput,
  };

  const start = async () => {
    startDelay && (await sleep(startDelay));
    typeLoop(loopInput);
  };

  /**
   * Emit a string to be added to the list of strings to be typed
   * @param {string} input string to be added to the queue
   * @param {undefined|number|true} index index of the string in the queue, if true, it will be the last string in the queue, if undefined, it will add it a new string to the queue
   */
  const streamInput = (input, index) => {
    if (index === true) {
      index = loopInput.queue.length - 1;
    }
    if (typeof index === "number" && index < loopInput.queue.length) {
      loopInput.queue[index] += input;
    } else {
      loopInput.queue.push(input);
    }
    if (!loopInput.isRunning) {
      typeLoop(loopInput);
    }
  };

  start();
  return streamInput;
};

export const realTyperDefaultProps = {
  strings: "",
  cursorCharacter: "|",
  typeSpeed: 100,
  deleteSpeed: 50,
  holdDelay: 1500,
  pauseDelay: 1000,
  startDelay: 0,
  delete: true,
  deleteLastString: true,
  loop: true,
  loopHold: 1500,
  loopStartIndex: 0,
  callback: () => {},
  callbackArgs: undefined,
  developerMode: false,
};

export const cursorBlinkingAnimation = `@keyframes blink { 0% { opacity: 0; } 50% { opacity: 1; } 100% { opacity: 0; } }`;
export const cursorBlinkingStyle = `animation: blink 0.75s infinite;`;

export default realType;
