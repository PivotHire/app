import OpenAI from 'openai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const openai = new OpenAI();
    const { messages, currentStepName, formData } = await req.json();

    // Define required fields for each step to guide the AI
    const stepRequirements: Record<string, string[]> = {
        "Business Profile": ["businessName", "industry"],
        "Project Info": ["projectTitle", "projectDescription"],
        "Budget & Timeline": ["budget", "timeline"],
        "Tech Stack": ["techStack"],
        "Talent Preference": ["talentType"],
    };

    const currentRequirements = stepRequirements[currentStepName] || [];

    // Check what is missing
    const currentStepData = currentRequirements.reduce((acc: any, field) => {
        acc[field] = formData?.[field] || "";
        return acc;
    }, {});

    const missingFields = currentRequirements.filter(field => !formData?.[field]);

    let response;
    try {
        response = await openai.chat.completions.create({
            model: 'gpt-5-mini-2025-08-07',
            messages: [
                {
                    role: 'system',
                    content: `You are a helpful assistant for "PivotHire", a platform that helps businesses define their task requirements.
    Your goal is to guide the user through defining their task requirements step-by-step.
    
    The steps are:
    1. Business Profile (Company Name, Industry)
    2. Project Info (Title, Description)
    3. Budget & Timeline
    4. Tech Stack
    5. Talent Preference (Seniority, Agency/Freelancer)
    
    CURRENT STEP: "${currentStepName || 'Unknown'}"
    REQUIRED FIELDS FOR THIS STEP: ${currentRequirements.join(', ')}
    
    CURRENT FORM STATE (For this step):
    ${JSON.stringify(currentStepData, null, 2)}
    
    MISSING FIELDS: ${missingFields.length > 0 ? missingFields.join(', ') : 'None - Step looks complete'}

    INSTRUCTIONS:
    1. **NO GUESSING**: Do not infer missing fields. For example, do not guess the Industry from the Company Name. You MUST ask the user.
    2. Focus ONLY on gathering information for the CURRENT STEP.
    3. If there are MISSING FIELDS, ask for them one by one or together. DO NOT move to the next step.
    4. When the user provides information, ALWAYS use the 'updateTaskInfo' tool.
    5. AFTER calling the tool, confirm the update with the user.
    6. CRITICAL: Do NOT call the 'completeStep' tool unless ALL required fields for this step are non-empty and the user has confirmed they are correct.
    7. Only when the user says "Yes" or confirms the full data for this step, call 'completeStep'.
    8. **SILENT TOOL CALLS**: When calling a tool (updateTaskInfo or completeStep), DO NOT generate any text explanation. ONLY generate the tool call JSON. You will provide the confirmation in the next turn.

    NEGATIVE CONSTRAINTS:
    - NEVERY GUESS OR INFER INFORMATION.
    - If the user says "PivotHire", ONLY set businessName to "PivotHire". Leave industry EMPTY.
    - Do not validat or normalize data unless obviously wrong.
    - Do not make up information. Only use what the user provides.
    If the user has provided all information, ask if they want to review or submit.`
                },
                ...messages
            ],
            stream: true,
            tools: [
                {
                    type: 'function',
                    function: {
                        name: 'updateTaskInfo',
                        description: 'Update the task information form with details provided by the user. ONLY set fields that the user has EXPLICITLY provided. Do not guess or infer values.',
                        parameters: {
                            type: 'object',
                            properties: {
                                businessName: { type: 'string' },
                                industry: { type: 'string' },
                                projectTitle: { type: 'string' },
                                projectDescription: { type: 'string' },
                                budget: { type: 'string' },
                                timeline: { type: 'string' },
                                techStack: { type: 'string' },
                                talentType: { type: 'string' },
                            },
                        },
                    },
                },
                {
                    type: 'function',
                    function: {
                        name: 'completeStep',
                        description: 'Call this when the user has confirmed the information for the current step and is ready to move to the next step.',
                        parameters: {
                            type: 'object',
                            properties: {},
                        },
                    },
                },
            ],
        });
    } catch (error: any) {
        return Response.json({ error: error.message }, { status: error.status || 500 });
    }


    // Create a ReadableStream from the OpenAI AsyncIterable
    const stream = new ReadableStream({
        async start(controller) {
            for await (const chunk of response) {
                const text = JSON.stringify(chunk);
                controller.enqueue(new TextEncoder().encode(text + '\n\n'));
            }
            controller.close();
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
