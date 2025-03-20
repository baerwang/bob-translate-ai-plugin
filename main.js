function supportLanguages() {
    return ['auto', 'en', 'zh-Hans', 'zh-Hant'];
}

const AI_CONFIG = {
    deepseek: {
        url: "https://api.deepseek.com/v1/chat/completions",
        model: "deepseek-chat",
        timeout: 10000 // 接口级超时配置
    },
    openai: {
        url: "https://api.openai.com/v1/chat/completions",
        model: "gpt-3.5-turbo",
        timeout: 8000
    }
};

async function translateAPI(text, detectTo) {
    try {
        const aiType = $option.ai;
        const selectedAI = AI_CONFIG[aiType];

        // 配置检查
        if (!selectedAI?.url || !selectedAI?.model) {
            throw new Error("❌ 请检查接口配置");
        }

        // API密钥检查
        const apiKey = $option.apikey; // 注意变量名必须与 config.json 完全匹配
        if (!apiKey) {
            throw new Error("❌ 请填写API密钥");
        }

        // 发送请求（关键改动：使用 $http.timeout）
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
                        content: "你是一个专业翻译引擎，请严格按以下规则处理：\n1. 接收英文输入\n2. 同时生成标准中文翻译和中式英语（Chinese English）\n3. 中式英语需包含中文谐音标注，格式：英文单词→中文谐音，如：you→优\n4. 输出格式为：\n标准中文：\n[内容]\n\n中式英语：\n[内容]（标注说明）"
                    },
                    {
                        role: "user",
                        content: text // 直接使用原始文本
                    }
                ]
            },
            timeout: selectedAI.timeout // 核心修复点
        });

        // 处理响应
        if (response.data.error) {
            throw new Error(`接口返回错误: ${response.data.error.message}`);
        }

        return response.data.choices[0].message.content;

    } catch (error) {
        // 超时错误特殊处理
        if (error.message.includes('timed out')) {
            throw new Error(`请求超时（${selectedAI.timeout}ms）`);
        }
        throw error;
    }
}

function translate(query, completion) {
    translateAPI(query.text, query.detectTo)
        .then(result => {
            completion({ result });
        })
        .catch(error => {
            completion({
                error: {
                    type: "apiError",
                    message: error.message.replace(/[^\x20-\x7E\u4E00-\u9FA5]/g, "") // 过滤非法字符
                }
            });
        });
}
