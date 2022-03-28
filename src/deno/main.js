const resp = await fetch(
  "https://raw.githubusercontent.com/chfchf0306/jeidian4.18/main/4.18",
);
const data = await resp.text();
const time = new Date();

// const filename = `./archives/jeidian4.18/${
//   time.toISOString().substring(0, 10)
// }.txt`;
const filename = `./archives/jeidian4.18/latest.txt`;
const decoded_data = atob(data, "base64");
await Deno.writeTextFile(filename, decoded_data);
