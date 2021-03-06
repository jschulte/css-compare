// Using Rework, not PostCSS, because Rework does reformat whitespace.

var rework = require('rework');
var fs = require('fs');
var color = require('color-parser');
var diff = require('diff');

function colorString(value) {
  var c = color(value);
  if (c) {
    c = 'rgba('+c.r+', '+c.g+', '+c.b+', '+(c.a||1)+');';
  }
  return c;
}

function normalize(root, rw) {
  // TODO: Use the source position to inform our diff?

  root.rules = root.rules.filter(function(rule){
    return rule.type !== 'comment';
  });

  root.rules.forEach(function(rule){
    if (rule.selectors) {
      rule.selectors = rule.selectors.map(function(selector){
        return selector
          .replace(/\s+/g, ' ')
          .replace(/\s*([+>])\s*/g, ' $1 ');
      });
    }

    if (rule.declarations) {
      rule.declarations.forEach(function(declaration){
        if (declaration.value) {
          declaration.value = colorString(declaration.value) || declaration.value;
          declaration.value = declaration.value
            .replace(/,\s*/g, ', ')
            .replace(/'/g, '"');
        }
      });
    }
  });
}

module.exports = function(test, control, label, output){
  var controlOutput = rework(fs.readFileSync(control).toString()).use(normalize).toString();
  var testOutput = rework(fs.readFileSync(test).toString()).use(normalize).toString();

  if (output) {
    var controlPath = control.replace('.css', '-normalized.css');
    var testPath = test.replace('.css', '-normalized.css');
    fs.writeFileSync(controlPath, controlOutput);
    fs.writeFileSync(testPath, testOutput);
  }

  return {
    "diff": diff.createPatch(label || test, controlOutput, testOutput),
    "control": controlOutput,
    "test": testOutput
  }
}
