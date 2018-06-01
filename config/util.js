let middlewareObj = {};

middlewareObj.isEqualString = (s1, s2) => {
  return s1 < s1 ? -1 : s1 > s2 ? 1 : 0;
}

module.exports = middlewareObj;