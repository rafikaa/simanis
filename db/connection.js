const mongoose = require('mongoose');

const connect = async () => {
  const uri =
    'mongodb://simanis:z3J8LkiT6Q6O3sbHPWMw@ds211269.mlab.com:11269/heroku_qcwdmgxx';

  mongoose.connect(uri, { useNewUrlParser: true });
  mongoose.set('debug', true);

  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', function() {
    console.log(`Connected to MongoDB: ${uri}`);
  });
};

module.exports = {
  connect,
};
