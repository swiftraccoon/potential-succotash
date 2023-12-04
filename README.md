# sdrtrunk-transcribed-web

Node.JS website to display audio and transcriptions from [cpp-sdrtrunk-transcriber](https://github.com/swiftraccoon/cpp-sdrtrunk-transcriber)


## Overview

tbd


## Features

- HTTPS
- [Apache Kafka](https://kafka.apache.org/): primarily handle the notification and metadata management of new MP3 and transcription TXT files being available
- [SimpleWebAuthn](https://simplewebauthn.dev/) handles authentication
- [Elasticsearch](https://github.com/elastic/elasticsearch-js)
- Subscription: have all new transcriptions checked for a match on a regex, if matched, email to specified address
- AI Search: perform AI integrated search (e.g. "give me a summary of all transcriptions on 20231120")
- MongoDB: user account storage
- ?[Redis](https://redis.io/): caching X days of transcription/searches/etc
- [MinIO|Ceph] for Distributed File Storage for MP3 and TXT files
- 
