const AWS = require('aws-sdk')
const axios = require('axios')

// Name of a service, any string
const serviceName = process.env.SERVICE_NAME
// URL of a service to test
const url = process.env.URL

// CloudWatch client
const cloudwatch = new AWS.CloudWatch();

exports.handler = async (event) => {
    let endTime;
    let requestWasSuccessful;
    let latencyInMs;

    const startTime = timeInMs();
    const res = await axios.get(url);

    requestWasSuccessful = res.status === 200 ? 1 : 0;
    endTime = timeInMs();
    latencyInMs = endTime - startTime;

    await cloudwatch.putMetricData({
        MetricData: [
            {
                MetricName: 'Successful',
                Dimensions: [
                    {
                        Name: 'ServiceName',
                        Value: serviceName
                    }
                ],
                Unit: 'Count',
                Value: requestWasSuccessful
            },
            {
                MetricName: 'Latency',
                Dimensions: [
                    {
                        Name: 'ServiceName',
                        Value: serviceName
                    }
                ],
                Unit: 'Milliseconds',
                Value: latencyInMs
            }
        ],
        Namespace: 'Udacity/Serverless'
    }).promise()
}

function timeInMs() {
    return new Date().getTime()
}
