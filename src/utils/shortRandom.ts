const shortRandom = (): number => {
  const lastMillis = Number(Date.now().toString().substring(8));
  const result = lastMillis * (Math.random() * 1000);

  return Math.floor(result.valueOf());
};

export default shortRandom;
