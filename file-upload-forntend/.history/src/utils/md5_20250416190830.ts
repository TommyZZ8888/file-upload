import SparkMD5 from "spark-md5";

const DEFAULT_SIZE = 20 * 1024 * 1024;

const md5 = (file: File, chunkSize: number = DEFAULT_SIZE): Promise<string> => {
  return new Promise((resolve, reject) => {
    const startMs = new Date().getTime();
    // const blobSlice =
    //   File.prototype.slice ||
    //   File.prototype.mozSlice ||
    //   File.prototype.webkitSlice;
    // const blobSlice =
    //   File.prototype.slice ||
    //   File.prototype.mozSlice ||
    //   File.prototype.webkitSlice;
    const chunks = Math.ceil(file.size / chunkSize);
    let currentChunk = 0;
    const spark = new SparkMD5.ArrayBuffer();
    const fileReader = new FileReader();

    fileReader.onload = function (e: ProgressEvent<FileReader>) {
      if (e.target?.result) {
        spark.append(e.target.result as ArrayBuffer);
        currentChunk++;
        if (currentChunk < chunks) {
          loadNext();
        } else {
          const md5 = spark.end();
          console.log(
            "文件md5计算结束，总耗时：",
            (new Date().getTime() - startMs) / 1000,
            "s"
          );
          resolve(md5);
        }
      }
    };

    fileReader.onerror = function (e: ProgressEvent<FileReader>) {
      reject(e);
    };

    function loadNext(): void {
      console.log("当前part number：", currentChunk, "总块数：", chunks);
      const start = currentChunk * chunkSize;
      let end = start + chunkSize;
      if (end > file.size) {
        end = file.size;
      }
      fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
    }

    loadNext();
  });
};

export default md5;
