- Message Content:

    - Text:
        - cotent: string text content
        - dataJson: none

    - File:
        - content: string file reference id
        - dataJson:
            - name: string file name
            - type: string file mime type
            - size: string file size in bytes

    - Image:
        - content: string file reference id
        - dataJson:
            - name: string file name
            - type: string file mime type
            - size: string file size in bytes


- File Data:

    - file id: string file reference id
    - file type: Document/Image/Audio/Others
    - data: ArrayBuffer data


- Image generation result:

    - prompt: string prompt text
    - negative prompt: string negative prompt text
    - seed: string seed
    - number: numbers of generation
    - status: string none/success/error/running
    - aspect ratio: string
    - provider: string provider id
    - model: string model id
    - images: MessageContent[]

