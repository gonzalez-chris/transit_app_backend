# transit_app_backend

The 'lib' file can be zipped and uploaded directly to AWS lambda. Then, the lambda can be connected directly to Amazon API Gateway to run this as an independent backend.

The backend reads from a file and not from a database because lambda & API Gateway are free under the Amazon free tier, but a SQL database would cost money. This decision was made from a cost basis only. DynamoDB (NoSQL) is free for a year but given the structured nature of the data it makes more sense to use an SQL database.
