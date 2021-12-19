console.log("hello world!");

for (const arg of Deno.args) {
  console.log(arg);
}

const resp = await fetch(
  "https://raw.fastgit.org/chfchf0306/jeidian4.18/main/4.18",
);
const data = await resp.text();
const time = new Date();
const filename =
  `${time.getFullYear()}-${time.getMonth()}-${time.getDay()}.txt`;
const decoded_data = atob(data, "base64");
await Deno.writeTextFile(filename, decoded_data);
