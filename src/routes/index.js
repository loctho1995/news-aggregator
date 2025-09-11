module.exports=(app)=>{
app.use(require('./news.js'));
app.use(require('./sources.js'));
app.use(require('./summary.js'));
app.use(require('./translate.js'));
app.use(require('./health.js'));
};
