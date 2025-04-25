module.exports = {
  spawn: (...args) => {
    console.info("ignoring: child_process.spawn", args);
    return {
      on: (event, callback) => {
        if (event === "close") {
          setTimeout(() => {
            callback(0);
          }, 0);
        }
      }
    }
  }
}