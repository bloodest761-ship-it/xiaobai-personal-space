import type { ContentCategory, Entry, Project } from "@/types/content";

export const categories: ContentCategory[] = [
  {
    type: "reflection",
    name: "心得",
    description: "记录学习和实践之后，认知发生变化的过程。",
    href: "/space/reflection",
  },
  {
    type: "essay",
    name: "随笔",
    description: "保存尚未完全成熟，但值得留下的个人思考。",
    href: "/space/essay",
  },
  {
    type: "project",
    name: "项目",
    description: "展示项目目标、过程、问题、调整和当前成果。",
    href: "/space/project",
  },
  {
    type: "understanding",
    name: "理解",
    description: "用自己的语言重新解释学过的知识。",
    href: "/space/understanding",
  },
];

export const focusItems = ["机器人", "嵌入式控制", "计算机视觉", "软件工程", "学习方法"];

export const entries: Entry[] = [
  {
    slug: "robot-arm-first-run-reflection",
    type: "reflection",
    title: "机械臂第一版跑通后，我学到了什么",
    summary:
      "示例内容：记录六自由度机械臂第一版能动起来之后，对结构、调试和阶段性目标的重新理解。",
    publishedAt: "2026-06-18",
    updatedAt: "2026-06-22",
    tags: ["机器人", "调试", "阶段复盘"],
    featured: true,
    cover: {
      src: "/images/cover-robot-arm.svg",
      alt: "六自由度机械臂项目的示例线框封面",
    },
    body: [
      "这是阶段 1 的示例内容，用来验证公开端页面结构和中文阅读体验。实际文章会在后续后台完成后由站点所有者补充。",
      "第一版跑通最重要的价值，不是证明项目已经完整完成，而是让问题从抽象想象变成可以观察、可以拆解、可以调整的具体对象。",
      "我原来更关注能不能一次做对，现在更能接受先得到一个粗糙但可运行的版本，再围绕误差、稳定性和控制体验逐步改进。",
      "接下来需要补充更真实的调试记录、图片说明和失败细节，避免把仍在进行中的项目包装成最终成果。",
    ],
  },
  {
    slug: "onnx-ncnn-understanding",
    type: "understanding",
    title: "我现在如何理解ONNX和NCNN",
    summary:
      "示例内容：用自己的语言解释模型交换格式和端侧推理框架之间的关系，以及仍然不确定的部分。",
    publishedAt: "2026-06-08",
    updatedAt: "2026-06-12",
    tags: ["计算机视觉", "模型部署", "待补充"],
    featured: true,
    cover: {
      src: "/images/cover-vision.svg",
      alt: "目标检测与模型部署的示例封面",
    },
    body: [
      "这是阶段 1 的示例理解文章，用来展示知识解释类内容的详情页排版。内容保持克制，不声称已经完成真实部署。",
      "我暂时把 ONNX 理解成一种让模型在不同训练和推理工具之间移动的中间表达，把 NCNN 理解成面向端侧设备的轻量推理框架。",
      "这两个概念容易混淆，是因为它们都出现在模型部署流程里，但一个更像格式桥梁，一个更像运行环境。",
      "后续需要用真实实验补充：模型转换步骤、算子兼容问题、端侧速度和精度变化。",
    ],
  },
  {
    slug: "ai-generated-code-learning-programming",
    type: "essay",
    title: "AI生成代码之后，人还需要学习编程吗",
    summary:
      "示例内容：一个仍在形成中的思考，讨论 AI 生成代码后，人学习编程的意义可能发生了什么变化。",
    publishedAt: "2026-05-28",
    updatedAt: "2026-06-01",
    tags: ["软件工程", "学习方法", "思考"],
    featured: false,
    body: [
      "这是阶段 1 的示例随笔，用来展示尚未完全成熟但值得保存的个人思考。",
      "AI 能生成代码之后，学习编程的重点可能从记住语法，转向理解问题、描述目标、判断方案和维护系统。",
      "但这不等于人可以完全不学。越是依赖生成工具，越需要知道什么是合理的抽象、边界、测试和错误处理。",
      "这个观点仍然需要继续观察，尤其需要通过真实项目开发过程来验证。",
    ],
  },
];

export const projects: Project[] = [
  {
    slug: "six-dof-robot-arm",
    type: "project",
    name: "六自由度机械臂",
    title: "六自由度机械臂",
    summary: "示例项目：项目仍在进行中，用于记录结构搭建、控制调试和后续迭代。",
    status: "in_progress",
    startedAt: "2026-04-01",
    updatedAt: "2026-06-24",
    techStack: ["机器人", "嵌入式控制", "机械结构"],
    featured: true,
    cover: {
      src: "/images/cover-robot-arm.svg",
      alt: "六自由度机械臂项目的示例线框封面",
    },
    gallery: [
      {
        src: "/images/gallery-robot-arm-structure.svg",
        alt: "机械臂结构拆解的示例图",
      },
      {
        src: "/images/gallery-control-loop.svg",
        alt: "机械臂控制流程的示例图",
      },
    ],
    sections: {
      background: [
        "这个项目用于记录机械臂从结构搭建到控制调试的过程。当前内容为示例骨架，真实细节待后续补充。",
      ],
      goals: [
        "先完成可观察、可调试的第一版，而不是一开始追求完整产品化。",
        "限制条件包括时间、零件精度、控制经验和调试记录仍不完整。",
      ],
      process: [
        "第一阶段围绕结构连接、基本动作和控制信号跑通展开。",
        "每次调整都需要记录现象、猜测原因和验证结果，避免只留下最后结论。",
      ],
      problems: [
        "仍在进行中：稳定性、运动精度、线缆整理和调试方法都需要继续验证。",
      ],
      adjustments: [
        "把目标拆成能动起来、能重复、能解释问题三个层级，减少一次性完成的压力。",
      ],
      result: [
        "当前结果标记为示例内容和进行中项目，不宣称已经完成最终效果。",
      ],
      learnings: [
        "项目真正有价值的部分不只是成果，而是每次误差和调整让理解变得更具体。",
      ],
      nextSteps: [
        "补充真实照片、调试日志、控制方案和阶段性复盘。",
      ],
    },
  },
  {
    slug: "yolo-object-detection-practice",
    type: "project",
    name: "YOLO目标检测学习与实践",
    title: "YOLO目标检测学习与实践",
    summary: "示例项目：记录目标检测学习、实验和部署理解，内容待真实实验继续补充。",
    status: "iterating",
    startedAt: "2026-05-10",
    updatedAt: "2026-06-16",
    techStack: ["YOLO", "OpenCV", "ONNX", "NCNN"],
    featured: true,
    cover: {
      src: "/images/cover-vision.svg",
      alt: "YOLO目标检测学习与实践的示例封面",
    },
    gallery: [
      {
        src: "/images/gallery-detection-grid.svg",
        alt: "目标检测框示意的示例图",
      },
      {
        src: "/images/gallery-model-pipeline.svg",
        alt: "模型转换流程的示例图",
      },
    ],
    sections: {
      background: [
        "这个项目用于记录从目标检测基础概念到实际实验流程的学习过程，当前为公开端展示所需的示例内容。",
      ],
      goals: [
        "理解目标检测的基本输入输出、训练和推理流程。",
        "后续尝试把模型转换到适合端侧运行的格式。",
      ],
      process: [
        "先梳理 YOLO、OpenCV、ONNX 和 NCNN 在流程中的位置，再逐步补充实验记录。",
      ],
      problems: [
        "仍需真实验证模型转换兼容性、推理速度和不同设备上的表现。",
      ],
      adjustments: [
        "避免只记录命令步骤，后续会补充每一步为什么这样做，以及遇到问题时如何判断。",
      ],
      result: [
        "当前结果为学习与实践框架，具体实验数据待补充。",
      ],
      learnings: [
        "模型部署不是单一工具问题，而是训练、格式、算子、设备和性能目标之间的协调。",
      ],
      nextSteps: [
        "补充真实数据集、转换过程、端侧测试截图和失败记录。",
      ],
    },
  },
];
