declare module "@/utils/md5" {
  function md5(file: File): Promise<string>;
  export default md5;
}
