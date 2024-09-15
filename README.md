# Table of Contents

[![wakatime](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/3a066fab-d2d5-4d84-b881-c1adffbfcf52.svg)](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/3a066fab-d2d5-4d84-b881-c1adffbfcf52) ![GitHub](https://img.shields.io/github/license/ragaeeb/ocr-js) ![npm](https://img.shields.io/npm/v/@ragaeeb/ocr-js) ![npm](https://img.shields.io/npm/dm/ocr-js) ![GitHub issues](https://img.shields.io/github/issues/ragaeeb/ocr-js) ![GitHub stars](https://img.shields.io/github/stars/ragaeeb/ocr-js?style=social) ![GitHub Release](https://img.shields.io/github/v/release/ragaeeb/ocr-js) [![codecov](https://codecov.io/gh/ragaeeb/ocr-js/graph/badge.svg?token=2YTE1LS8CC)](https://codecov.io/gh/ragaeeb/ocr-js) [![Size](https://deno.bundlejs.com/badge?q=@ragaeeb/ocr-js@1.0.0&badge=detailed)](https://bundlejs.com/?q=@ragaeeb/ocr-js%401.0.0) ![typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label&color=blue)

The `ocr-js` project simplifies the process of performing OCR on documents sent to 3rd party services like Google Document AI.

# ocr-js Usage Guide

This guide explains how to use the exported functions from `ocr-js`.

## Installation

```bash
npm i @ragaeeb/ocr-js
```

## Prerequisites

Node.js (v20 or higher)
Google Cloud account with `Document AI` and `Cloud Storage` enabled
Service account credentials with necessary permissions.

## Configuration

Before using the functions, you need to initialize the configuration:

```javascript
import { init } from './index';

init({
    bucketUri: 'gs://your-bucket-name',
    processorId: 'your-processor-id',
    processorVersion: 'your-processor-version',
    projectId: 'your-project-id',
    projectLocation: 'your-project-location',
});
```

-   bucketUri: The URI of your Google Cloud Storage bucket.
-   processorId: The ID of your Document AI processor.
-   processorVersion: The version of your processor.
-   projectId: Your Google Cloud project ID.
-   projectLocation: The location of your processor (e.g., us-central1).

## Usage

### Initialization

Initialize the configuration as shown above before calling any other functions.

### Requesting OCR

To request OCR processing for a PDF file:

```javascript
import { requestOCR } from './index';

const pdfFile = 'path/to/your/file.pdf'; const options = { language: 'en', // Specify language hints };

requestOCR(pdfFile, options) .then((result) => { console.log('OCR request successful:', result); }) .catch((error) => { console.error('Error requesting OCR:', error); });
```

### Retrieving OCR Results

After the OCR processing is complete, retrieve the results:

```javascript
import { getOCRResult } from './index';

const requestId = 'your-request-id'; // Use the requestId from the requestOCR result

getOCRResult(requestId)
    .then((pages) => {
        console.log('OCR results:', pages);
    })
    .catch((error) => {
        console.error('Error retrieving OCR results:', error);
    });
```

## Contributing

Contributions are welcome! Please submit a pull request or open an issue to discuss changes.

## License

This project is licensed under the MIT License.
