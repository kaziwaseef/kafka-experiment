require('dotenv').config();
const kafka = require('kafka-node');

const { Offset } = kafka;

// JS sleep helper
const sleep = time => new Promise(resolve => setTimeout(resolve, time));

// provider helper
const sendToQueue = (producer, topic, messages) => {
  producer.send(
    [
      {
        topic,
        messages,
        attributes: process.env.PRODUCER_ATTRIBUTES,
        timestamp: Date.now(),
      },
    ],
    (err, result) => {
      console.log('Sent message at --->', err || result);
    },
  );
};

/*
* If consumer get `offsetOutOfRange` event, fetch data from the smallest(oldest) offset
*/
const offsetOutOfRangeCb = (client, consumer) => (topic) => {
  const offset = new Offset(client);
  const topicUpdated = topic;
  topicUpdated.maxNum = 2;
  offset.fetch([topicUpdated], (err, offsets) => {
    if (err) {
      return console.error(err);
    }
    const min = Math.min(offsets[topicUpdated.topic][topicUpdated.partition]);
    return consumer.setOffset(topicUpdated.topic, topicUpdated.partition, min);
  });
};

const gracefulShutdown = consumer => () => {
  console.log('Shutdown started....');
  consumer.close((err) => {
    console.log('Kafka connection closed >>>>>');
    process.exit(err ? 1 : 0);
  });
};

module.exports = {
  sleep,
  sendToQueue,
  offsetOutOfRangeCb,
  gracefulShutdown,
};
