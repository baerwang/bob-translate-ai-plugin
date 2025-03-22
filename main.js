function supportLanguages() {
    return ['auto', 'en', 'zh-Hans', 'zh-Hant'];
}

const AI_CONFIG = {
    deepseek: {
        url: "https://api.deepseek.com/v1/chat/completions",
        model: "deepseek-chat",
        timeout: 10000,
        content: '你是一个专业翻译引擎，请严格按以下规则处理：\n1. 接收英文输入\n2. 同时生成标准中文翻译和中式英语（Chinese English）\n3. 中式英语需包含中文谐音标注，格式：英文单词→中文谐音，如：you→优\n4. 输出格式为：\n标准中文：\n[内容]\n\n中式英语：\n[内容]（标注说明）'
    },
    openai: {
        url: "https://api.openai.com/v1/chat/completions",
        model: "gpt-3.5-turbo",
        timeout: 8000,
        content: 'You are a professional translation engine, must strictly follow rules: After receiving English input, generate both standard Chinese translation and Chinese English. Chinese English must include homophone notes (format example: you→yōu). Final output format (输出格式):\nStandard Chinese: [content]\nChinese English: [content]'
    },
    xunfei: {
        url: "https://spark-api-open.xf-yun.com/v1/chat/completions",
        model: "4.0Ultra",
        timeout: 8000,
        content: '你是一个专业翻译引擎，请严格按以下规则处理：\n1. 接收英文输入\n2. 同时生成标准中文翻译和中式英语（Chinese English）\n3. 中式英语需包含中文谐音标注，格式：英文单词→中文谐音，如：you→优\n4. 输出格式为：\n标准中文：\n[内容]\n\n中式英语：\n[内容]'
    }
};

async function translateAPI(text, detectTo) {
    try {
        if detectTo !== 'en' {
            throw new Error("❌ only support translate to English");
        }
        const aiType = $option.ai;
        const selectedAI = AI_CONFIG[aiType];

        if (!selectedAI?.url || !selectedAI?.model) {
            throw new Error("❌ please select a valid AI engine");
        }

        const apiKey = $option.apikey;
        if (!apiKey) {
            throw new Error("❌ please enter the API key");
        }

        const response = await $http.post({
            url: selectedAI.url,
            header: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: {
                model: selectedAI.model,
                messages: [
                    {
                        role: "system",
                        content: selectedAI.content
                    },
                    {
                        role: "user",
                        content: text
                    }
                ]
            },
            timeout: selectedAI.timeout
        });

        if (response.data.error) {
            throw new Error(`api error: ${response.data.error.message}`);
        }

        return response.data.choices[0].message.content;

    } catch (error) {
        if (error.message.includes('timed out')) {
            throw new Error(`api timeout（${selectedAI.timeout}ms）`);
        }
        throw error;
    }
}

function translate(query, completion) {
    translateAPI(query.text, query.detectTo)
        .then(resp => {
            let result = {
               from: query.detectFrom,
                to: query.detectTo,
                fromParagraphs: [query.source],
                toParagraphs: [resp],
            };
            completion({ result });
        })
        .catch(error => {
            completion({
                error: {
                    type: "apiError",
                    message: error.message.replace(/[^\x20-\x7E\u4E00-\u9FA5]/g, "")
                }
            });
        });
}
