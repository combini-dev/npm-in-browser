/*
@license
The code in this file is originally copied from https://github.com/YuzuJS/setImmediate/commit/f1ccbfdf09cb93aadf77c4aa749ea554503b9234
It is licensed under MIT: https://github.com/YuzuJS/setImmediate/blob/f1ccbfdf09cb93aadf77c4aa749ea554503b9234/LICENSE.txt
The following is the original copyright text:

Copyright (c) 2012 Barnesandnoble.com, llc, Donavon West, and Domenic Denicola

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

const global = globalThis;

// Spec says greater than zero
let nextHandle = 1;
var tasksByHandle = {};
var currentlyRunningATask = false;
var registerImmediate;

function setImmediate(callback) {
  // Callback can either be a function or a string
  if (typeof callback !== "function") {
    callback = new Function("" + callback);
  }
  // Copy function arguments
  var args = new Array(arguments.length - 1);
  for (var i = 0; i < args.length; i++) {
    args[i] = arguments[i + 1];
  }
  // Store and register the task
  var task = { callback: callback, args: args };
  tasksByHandle[nextHandle] = task;
  registerImmediate(nextHandle);
  return nextHandle++;
}

function clearImmediate(handle) {
  delete tasksByHandle[handle];
}

function run(task) {
  var callback = task.callback;
  var args = task.args;
  switch (args.length) {
    case 0:
      callback();
      break;
    case 1:
      callback(args[0]);
      break;
    case 2:
      callback(args[0], args[1]);
      break;
    case 3:
      callback(args[0], args[1], args[2]);
      break;
    default:
      callback.apply(undefined, args);
      break;
  }
}

function runIfPresent(handle) {
  // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
  // So if we're currently running a task, we'll need to delay this invocation.
  if (currentlyRunningATask) {
    // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
    // "too much recursion" error.
    setTimeout(runIfPresent, 0, handle);
  } else {
    var task = tasksByHandle[handle];
    if (task) {
      currentlyRunningATask = true;
      try {
        run(task);
      } finally {
        clearImmediate(handle);
        currentlyRunningATask = false;
      }
    }
  }
}

registerImmediate = function (handle) {
  Promise.resolve().then(() => runIfPresent(handle));
};

module.exports.setImmediate = setImmediate;
module.exports.clearImmediate = clearImmediate;
