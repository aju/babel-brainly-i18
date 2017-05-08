translator.trans('Something %replaced% then %else%', {
  replaced: 'REPLACED',
  else: 'ELSE'
});
translator.trans('Something %replaced% then %else%', {
  'replaced': 'REPLACED',
  else: 'ELSE',
  thisIsIgnored
});
translator.trans('Something %replaced% then %else% %replaced% %replaced% %else%', {
  'replaced': 'REPLACED',
  'else': 'ELSE'
});
translator.trans('Number of stars %stars% and average %average%', {
  stars: stats.stars,
  average: stats.average
});
translator.trans('Number of stars %stars% and average %average%', {
  stars: (() => 5)(),
  average: AVERAGE
});
