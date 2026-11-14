/* 由 demo/build-demo-data.mjs 生成，勿手改。重跑：npm run demo:data */
(function (root) {
  const DEMO = {
  "generatedAt": "fixed-for-reproducibility",
  "profiles": [
    {
      "key": "A",
      "label": "档案 A · 刚确诊",
      "name": "虚构患者甲",
      "age": 68,
      "sex": "男",
      "diagnosedAt": "2026-10-14",
      "startedAt": "2026-10-21",
      "weightKg": 72,
      "antibodies": {
        "ana": "untested",
        "note": "2026-10 首诊报告抄录；ANA 未查（GCA 无特异性抗体，仅鉴别参考）"
      },
      "imaging": {
        "method": "颞动脉超声（多普勒）",
        "value": "左颞动脉管壁低回声晕环（halo 征）（报告原文抄录）",
        "date": "2026-10-14",
        "note": "报告原文抄录，未判读"
      },
      "pmr": {
        "status": "untested",
        "note": "PMR 症状尚未排查，医生已安排随访",
        "lastVisit": null
      },
      "comorbidity": [
        {
          "name": "未见合并症记录",
          "since": null,
          "note": "刚确诊，还没排查完",
          "dept": null,
          "visibility": "shared"
        }
      ],
      "meds": [
        {
          "name": "泼尼松片",
          "doseText": "45 mg 每日 1 次（晨服，医生医嘱原文抄录；起始 40–60 mg/d【待核】）",
          "freq": "每日 1 次",
          "startDate": "2026-10-21",
          "approval": "unverified",
          "inUse": true
        }
      ],
      "adherence": [
        {
          "month": "2026-10",
          "missed": 0
        },
        {
          "month": "2026-11",
          "missed": 1
        }
      ],
      "episodes": [],
      "symptoms": [
        {
          "date": "2026-11-01",
          "headache": 6,
          "stiffness": 2,
          "scalp": true,
          "jaw": false,
          "vision": false,
          "note": "左颞部胀痛，梳头都疼",
          "visibility": "shared"
        },
        {
          "date": "2026-10-25",
          "headache": 3,
          "stiffness": 1,
          "scalp": false,
          "jaw": false,
          "vision": false,
          "note": "",
          "visibility": "shared"
        }
      ],
      "screening": [
        {
          "type": "us_temporal",
          "date": "2026-10-14",
          "result": "颞动脉超声：左颞动脉管壁低回声晕环（halo 征）（报告原文抄录）",
          "detail": "确诊依据之一",
          "sectionTitle": "颞动脉超声（晕轮征 halo sign）"
        },
        {
          "type": "biopsy",
          "date": null,
          "result": null,
          "detail": "医生已安排，待做",
          "sectionTitle": "颞动脉活检（医生安排时）"
        }
      ],
      "questions": [
        {
          "id": "q1",
          "text": "ESR 降到多少算控制住？我的目标值是什么？",
          "done": false
        },
        {
          "id": "q2",
          "text": "激素要怎么减量？减量节奏谁说了算？",
          "done": false
        },
        {
          "id": "q3",
          "text": "如果突然看东西模糊，我应该怎么处理？",
          "done": false
        }
      ],
      "documents": [
        {
          "id": "d1",
          "name": "2026-10 颞动脉超声报告.pdf",
          "date": "2026-10-14",
          "parsed": false,
          "parseState": "unparsed"
        },
        {
          "id": "d2",
          "name": "2026-11 化验单.pdf",
          "date": "2026-11-08",
          "parsed": true,
          "parseState": "parsed"
        }
      ],
      "trials": [
        {
          "id": "t1",
          "title": "【虚构示例】GCA 症状负担登记研究",
          "source": "ctgov",
          "phase": "登记",
          "status": "登记状态，未核实",
          "area": "上海",
          "fictional": true
        }
      ],
      "pathway": [
        {
          "d": "2026-10-14",
          "phase": "确诊",
          "text": "新发头痛伴头皮压痛，颞动脉超声见晕环征后确诊",
          "detail": {
            "regimen": {
              "summary": "尚未开始用药",
              "items": [
                [
                  "方案",
                  "无"
                ],
                [
                  "说明",
                  "确诊当次未开药"
                ]
              ]
            },
            "metrics": {
              "summary": "ESR 76 mm/h（Westergren，单据未印上限）",
              "items": [
                [
                  "ESR",
                  "76 mm/h"
                ],
                [
                  "CRP",
                  "68 mg/L"
                ]
              ]
            },
            "imaging": {
              "summary": "颞动脉超声：左颞动脉低回声晕环（halo 征）",
              "items": [
                [
                  "报告原文",
                  "左颞动脉管壁低回声晕环，管腔未见闭塞"
                ]
              ]
            },
            "ae": {
              "summary": "无记录",
              "items": [
                [
                  "说明",
                  "此阶段未开始用药，未记副作用"
                ]
              ]
            },
            "support": {
              "summary": "无记录",
              "items": [
                [
                  "说明",
                  "未记录支持措施"
                ]
              ]
            }
          }
        },
        {
          "d": "2026-10-21",
          "phase": "开始激素",
          "text": "医生开了泼尼松，医嘱原文如记录",
          "detail": {
            "regimen": {
              "summary": "泼尼松 45 mg 每日 1 次（晨服）",
              "items": [
                [
                  "药名",
                  "泼尼松片"
                ],
                [
                  "剂量原文",
                  "45 mg 每日 1 次（晨服）"
                ],
                [
                  "频次",
                  "每日 1 次"
                ],
                [
                  "获批状态",
                  "未核实"
                ]
              ]
            },
            "metrics": {
              "summary": "2026-11 复查 ESR 52 mm/h、CRP 31 mg/L",
              "items": [
                [
                  "2026-11 ESR",
                  "52 mm/h"
                ],
                [
                  "2026-11 CRP",
                  "31 mg/L"
                ]
              ]
            },
            "imaging": {
              "summary": "本阶段未复查影像",
              "items": [
                [
                  "说明",
                  "无记录，不等于没做"
                ]
              ]
            },
            "ae": {
              "summary": "无记录",
              "items": [
                [
                  "说明",
                  "未记录"
                ]
              ]
            },
            "support": {
              "summary": "\"这个病我第一次听说\"",
              "items": [
                [
                  "患者原话",
                  "这个病我第一次听说，医生说的名字我都记不住"
                ]
              ]
            }
          }
        }
      ],
      "labs": [
        {
          "date": "2026-10-08",
          "items": [
            {
              "code": "ESR",
              "value": 77,
              "unit": "mm/h",
              "method": "Westergren（魏氏法）",
              "refLow": 0,
              "refHigh": null,
              "lab": "外院报告（未印上限）"
            },
            {
              "code": "CRP",
              "value": 67,
              "unit": "mg/L",
              "method": null,
              "refLow": 0,
              "refHigh": 10,
              "lab": "市一院检验科"
            },
            {
              "code": "Hb",
              "value": 114,
              "unit": "g/L",
              "method": null,
              "refLow": 115,
              "refHigh": 150,
              "lab": "市一院检验科"
            },
            {
              "code": "PLT",
              "value": 388,
              "unit": "10⁹/L",
              "method": null,
              "refLow": 125,
              "refHigh": 350,
              "lab": "市一院检验科"
            },
            {
              "code": "ALT",
              "value": 27,
              "unit": "U/L",
              "method": null,
              "refLow": 7,
              "refHigh": 40,
              "lab": "市一院检验科"
            },
            {
              "code": "FBG",
              "value": 5.3,
              "unit": "mmol/L",
              "method": null,
              "refLow": 3.9,
              "refHigh": 6.1,
              "lab": "市一院检验科"
            },
            {
              "code": "SBP",
              "value": 137,
              "unit": "mmHg",
              "method": "诊室血压测量",
              "refLow": null,
              "refHigh": null,
              "lab": "市一院检验科"
            },
            {
              "code": "DBP",
              "value": 80,
              "unit": "mmHg",
              "method": "诊室血压测量",
              "refLow": null,
              "refHigh": null,
              "lab": "市一院检验科"
            }
          ]
        },
        {
          "date": "2026-11-08",
          "items": [
            {
              "code": "ESR",
              "value": 54,
              "unit": "mm/h",
              "method": "Westergren（魏氏法）",
              "refLow": 0,
              "refHigh": 30,
              "lab": "市一院检验科"
            },
            {
              "code": "CRP",
              "value": 31,
              "unit": "mg/L",
              "method": null,
              "refLow": 0,
              "refHigh": 10,
              "lab": "市一院检验科"
            },
            {
              "code": "Hb",
              "value": 124,
              "unit": "g/L",
              "method": null,
              "refLow": 115,
              "refHigh": 150,
              "lab": "市一院检验科"
            },
            {
              "code": "PLT",
              "value": 319,
              "unit": "10⁹/L",
              "method": null,
              "refLow": 125,
              "refHigh": 350,
              "lab": "市一院检验科"
            },
            {
              "code": "ALT",
              "value": 26,
              "unit": "U/L",
              "method": null,
              "refLow": 7,
              "refHigh": 40,
              "lab": "市一院检验科"
            },
            {
              "code": "FBG",
              "value": 5.6,
              "unit": "mmol/L",
              "method": null,
              "refLow": 3.9,
              "refHigh": 6.1,
              "lab": "市一院检验科"
            },
            {
              "code": "SBP",
              "value": 131,
              "unit": "mmHg",
              "method": "诊室血压测量",
              "refLow": null,
              "refHigh": null,
              "lab": "市一院检验科"
            },
            {
              "code": "DBP",
              "value": 75,
              "unit": "mmHg",
              "method": "诊室血压测量",
              "refLow": null,
              "refHigh": null,
              "lab": "市一院检验科"
            }
          ]
        }
      ]
    },
    {
      "key": "B",
      "label": "档案 B · 长期随访",
      "name": "虚构患者乙",
      "age": 72,
      "sex": "女",
      "diagnosedAt": "2018-09-05",
      "startedAt": "2018-09-18",
      "weightKg": 58,
      "antibodies": {
        "ana": "negative",
        "note": "2018 年报告抄录；GCA 无特异性抗体，ANA 仅鉴别参考"
      },
      "imaging": {
        "method": "颞动脉超声（多普勒）",
        "value": "右颞动脉管壁低回声晕环（halo 征），较前对照变薄（报告原文抄录）",
        "date": "2026-03-11",
        "note": "报告原文抄录，未判读"
      },
      "pmr": {
        "status": "diagnosed",
        "note": "风湿性多肌痛（PMR），风湿科已安排随访",
        "lastVisit": "2026-04-30"
      },
      "comorbidity": [
        {
          "name": "风湿性多肌痛（PMR）",
          "since": "2020",
          "note": "风湿科，医生已安排随访",
          "dept": null,
          "visibility": "shared"
        },
        {
          "name": "甲状腺功能减退",
          "since": "2021",
          "note": "内分泌科，左甲状腺素 50 µg",
          "dept": null,
          "visibility": "shared"
        }
      ],
      "meds": [
        {
          "name": "泼尼松片",
          "doseText": "55 mg 每日 1 次（晨服，起始 40–60 mg/d【待核】，医嘱原文抄录）",
          "freq": "每日 1 次",
          "startDate": "2018-09-18",
          "approval": "unverified",
          "inUse": false
        },
        {
          "name": "泼尼松片",
          "doseText": "40 mg 每日 1 次（减量阶梯，医嘱原文抄录）",
          "freq": "每日 1 次",
          "startDate": "2018-12-10",
          "approval": "unverified",
          "inUse": false
        },
        {
          "name": "泼尼松片",
          "doseText": "20 mg 每日 1 次（减量阶梯，医嘱原文抄录）",
          "freq": "每日 1 次",
          "startDate": "2019-06-20",
          "approval": "unverified",
          "inUse": false
        },
        {
          "name": "泼尼松片",
          "doseText": "7.5 mg 每日 1 次（减量阶梯，医嘱原文抄录）",
          "freq": "每日 1 次",
          "startDate": "2020-03-15",
          "approval": "unverified",
          "inUse": false
        },
        {
          "name": "泼尼松片",
          "doseText": "5 mg 每日 1 次（维持剂量，医嘱原文抄录）",
          "freq": "每日 1 次",
          "startDate": "2020-09-01",
          "approval": "unverified",
          "inUse": true
        },
        {
          "name": "托珠单抗注射液",
          "doseText": "162 mg 皮下注射 每周 1 次【待核：间隔以医生医嘱为准】",
          "freq": "每周 1 次",
          "startDate": "2025-02-20",
          "approval": "unverified",
          "inUse": true
        },
        {
          "name": "阿司匹林肠溶片",
          "doseText": "100 mg 每日 1 次（小剂量，医生安排）",
          "freq": "每日 1 次",
          "startDate": "2025-02-25",
          "approval": "unverified",
          "inUse": true
        },
        {
          "name": "左甲状腺素钠片",
          "doseText": "50 µg 每日 1 次",
          "freq": "每日 1 次（另一科开）",
          "startDate": "2021-05-01",
          "approval": "unverified",
          "inUse": true
        }
      ],
      "adherence": [
        {
          "month": "2026-05",
          "missed": 0
        },
        {
          "month": "2026-06",
          "missed": 1
        },
        {
          "month": "2026-07",
          "missed": 0
        },
        {
          "month": "2026-08",
          "missed": 3
        },
        {
          "month": "2026-09",
          "missed": 0
        },
        {
          "month": "2026-10",
          "missed": 1
        }
      ],
      "episodes": [
        {
          "id": "e1",
          "start": "2021-04-12",
          "end": "2021-05-02",
          "hospital": "市一院",
          "signs": "新发双侧颞部头痛、头皮压痛明显",
          "labsNote": "ESR 88 mm/h、CRP 56 mg/L（当时化验原件未存，口头转述）",
          "treatment": "住院甲泼尼龙静脉治疗后改口服（医生处置原文大意）",
          "actionPlan": null,
          "note": "第一次发作，当时不知道这就是 GCA 活动",
          "visibility": "shared"
        },
        {
          "id": "e2",
          "start": "2023-02-10",
          "end": "2023-02-24",
          "hospital": "区中心医院",
          "signs": "头痛复发伴下颌跛行（嚼东西咬不动）",
          "labsNote": "ESR 76 mm/h",
          "treatment": "激素加量口服；医生调整减量节奏（原文大意）",
          "actionPlan": "医生给的计划原文：若再次出现头痛明显加重或看东西模糊，当天联系风湿科值班电话，不要等到复诊",
          "note": "这次记住了先打电话",
          "visibility": "shared"
        },
        {
          "id": "e3",
          "start": "2025-01-18",
          "end": "2025-01-27",
          "hospital": "市一院",
          "signs": "右眼一过性视物模糊，半小时自行缓解（按医生要求当日就诊）",
          "labsNote": "CRP 47 mg/L",
          "treatment": "医生安排加用托珠单抗（2025-02-20 起，医嘱原文见用药）",
          "actionPlan": "同上次医生计划（2023-02 记录）；另嘱：视力症状再发当日就诊",
          "note": "视力症状这次及时去了医院",
          "visibility": "shared"
        },
        {
          "id": "e4",
          "start": "2026-04-30",
          "end": "2026-05-12",
          "hospital": "市一院",
          "signs": "肩髋晨僵加重（PMR 症状）伴低热",
          "labsNote": "ESR 34 mm/h、CRP 21 mg/L",
          "treatment": "门诊调整激素后好转；医生调了复查节奏",
          "actionPlan": "同上次医生计划（2023-02 记录）",
          "note": "",
          "visibility": "shared"
        }
      ],
      "symptoms": [
        {
          "date": "2026-10-05",
          "headache": 2,
          "stiffness": 2,
          "scalp": false,
          "jaw": false,
          "vision": false,
          "note": "晨僵半小时，活动后好",
          "visibility": "shared"
        },
        {
          "date": "2026-09-18",
          "headache": 3,
          "stiffness": 2,
          "scalp": true,
          "jaw": false,
          "vision": false,
          "note": "",
          "visibility": "shared"
        },
        {
          "date": "2026-08-22",
          "headache": 5,
          "stiffness": 3,
          "scalp": true,
          "jaw": true,
          "vision": false,
          "note": "颞部跳痛，嚼东西发酸",
          "visibility": "shared"
        },
        {
          "date": "2026-07-11",
          "headache": 2,
          "stiffness": 1,
          "scalp": false,
          "jaw": false,
          "vision": true,
          "note": "一过性视物模糊，当天按医生要求就诊",
          "visibility": "shared"
        },
        {
          "date": "2026-06-09",
          "headache": 4,
          "stiffness": 3,
          "scalp": false,
          "jaw": false,
          "vision": true,
          "note": "午后视物模糊数分钟，医生让记录下来",
          "visibility": "shared"
        },
        {
          "date": "2026-05-16",
          "headache": 1,
          "stiffness": 2,
          "scalp": false,
          "jaw": false,
          "vision": false,
          "note": "",
          "visibility": "shared"
        }
      ],
      "screening": [
        {
          "type": "us_temporal",
          "date": "2026-03-11",
          "result": "颞动脉超声：右颞动脉晕环较前对照变薄（报告原文）",
          "detail": "按医生节奏复查，未判读",
          "sectionTitle": "颞动脉超声（晕轮征 halo sign）"
        },
        {
          "type": "cta",
          "date": "2025-06-18",
          "result": "CTA：升主动脉及主动脉弓管壁增厚较前相仿（报告原文）",
          "detail": "大血管评估，医生安排时做",
          "sectionTitle": "CTA / MRA（大血管成像）"
        },
        {
          "type": "petct",
          "date": null,
          "result": null,
          "detail": "医生已安排，待做",
          "sectionTitle": "PET-CT（医生安排时）"
        },
        {
          "type": "pmr_followup",
          "date": "2026-04-30",
          "result": "风湿科 PMR 随访：晨僵情况记录（就诊记录抄录）",
          "detail": "医生说按他的节奏复查",
          "sectionTitle": "PMR 随访（医生已安排）"
        }
      ],
      "questions": [
        {
          "id": "q1",
          "text": "激素还要吃多久？减量节奏怎么定？",
          "done": false
        },
        {
          "id": "q2",
          "text": "打完托珠单抗有点发热要紧吗？",
          "done": false
        },
        {
          "id": "q3",
          "text": "阿司匹林和我的其他药要错开吃吗？",
          "done": false
        },
        {
          "id": "q4",
          "text": "这次颞动脉超声结果和上次比怎么样？",
          "done": true
        }
      ],
      "documents": [
        {
          "id": "d1",
          "name": "2026-03 颞动脉超声.pdf",
          "date": "2026-03-11",
          "parsed": true,
          "parseState": "parsed"
        },
        {
          "id": "d2",
          "name": "2025-06 CTA.pdf",
          "date": "2025-06-18",
          "parsed": true,
          "parseState": "parsed"
        },
        {
          "id": "d3",
          "name": "2025-01 出院小结.pdf",
          "date": "2025-01-27",
          "parsed": false,
          "parseState": "unparsed"
        }
      ],
      "trials": [
        {
          "id": "t1",
          "title": "【虚构示例】GCA 长期随访观察研究",
          "source": "ictrp",
          "phase": "观察性",
          "status": "登记状态，未核实",
          "area": "广州",
          "fictional": true
        },
        {
          "id": "t2",
          "title": "【虚构示例】GCA 复发频率与托珠单抗研究",
          "source": "ctgov",
          "phase": "登记",
          "status": "登记状态，未核实",
          "area": "北京",
          "fictional": true
        }
      ],
      "pathway": [
        {
          "d": "2018-09-18",
          "phase": "确诊并开始激素",
          "text": "颞部头痛伴头皮压痛，超声与活检后确诊，开始泼尼松",
          "detail": {
            "regimen": {
              "summary": "泼尼松 55 mg 每日 1 次（晨服）",
              "items": [
                [
                  "药名",
                  "泼尼松片"
                ],
                [
                  "剂量原文",
                  "55 mg 每日 1 次（晨服）"
                ],
                [
                  "获批状态",
                  "未核实"
                ]
              ]
            },
            "metrics": {
              "summary": "确诊时 ESR 92 mm/h、CRP 61 mg/L",
              "items": [
                [
                  "2018-09 ESR",
                  "92 mm/h"
                ],
                [
                  "2018-09 CRP",
                  "61 mg/L"
                ]
              ]
            },
            "imaging": {
              "summary": "颞动脉超声：右颞动脉低回声晕环（halo 征）",
              "items": [
                [
                  "报告原文",
                  "右颞动脉管壁低回声晕环"
                ]
              ]
            },
            "ae": {
              "summary": "无记录",
              "items": [
                [
                  "说明",
                  "无记录"
                ]
              ]
            },
            "support": {
              "summary": "无记录",
              "items": [
                [
                  "说明",
                  "无记录"
                ]
              ]
            }
          }
        },
        {
          "d": "2023-02-10",
          "phase": "第一次发作",
          "text": "头痛复发伴下颌跛行，激素加量后缓解",
          "detail": {
            "regimen": {
              "summary": "激素加量（医嘱原文见调药记录）",
              "items": [
                [
                  "方案",
                  "泼尼松加量，医生原文照录"
                ]
              ]
            },
            "metrics": {
              "summary": "ESR 76 mm/h、CRP 39 mg/L",
              "items": [
                [
                  "说明",
                  "当时化验原件未留存，只有口头转述"
                ]
              ]
            },
            "imaging": {
              "summary": "住院期间颞动脉超声",
              "items": [
                [
                  "说明",
                  "报告未存档"
                ]
              ]
            },
            "ae": {
              "summary": "无新增",
              "items": [
                [
                  "说明",
                  "无记录"
                ]
              ]
            },
            "support": {
              "summary": "\"医生给了发作时的电话\"",
              "items": [
                [
                  "患者原话",
                  "这次医生给了值班电话，心里踏实多了"
                ]
              ]
            }
          }
        },
        {
          "d": "2025-02-20",
          "phase": "加用托珠单抗",
          "text": "视力症状发作后，医生安排加用托珠单抗",
          "detail": {
            "regimen": {
              "summary": "托珠单抗 162 mg 皮下注射 每周 1 次【待核】",
              "items": [
                [
                  "药名",
                  "托珠单抗注射液"
                ],
                [
                  "剂量原文",
                  "162 mg 皮下注射 每周 1 次"
                ],
                [
                  "获批状态",
                  "未核实"
                ]
              ]
            },
            "metrics": {
              "summary": "发作时 CRP 47 mg/L，加用后 1 个月 12 mg/L",
              "items": [
                [
                  "发作时 CRP",
                  "47 mg/L"
                ],
                [
                  "1 个月后 CRP",
                  "12 mg/L"
                ]
              ]
            },
            "imaging": {
              "summary": "CTA：主动脉管壁增厚较前相仿",
              "items": [
                [
                  "报告原文",
                  "升主动脉及主动脉弓管壁增厚较前相仿"
                ]
              ]
            },
            "ae": {
              "summary": "注射当晚低热",
              "items": [
                [
                  "记录",
                  "注射当晚低热，次日自行缓解"
                ]
              ]
            },
            "support": {
              "summary": "\"记下来就不慌\"",
              "items": [
                [
                  "患者原话",
                  "把每次的数记下来，去医院就不慌了"
                ]
              ]
            }
          }
        },
        {
          "d": "2026-03-11",
          "phase": "影像复查与化验评估",
          "text": "按医生节奏复查颞动脉超声与化验",
          "detail": {
            "regimen": {
              "summary": "维持原用药",
              "items": [
                [
                  "方案",
                  "未变更"
                ]
              ]
            },
            "metrics": {
              "summary": "ESR 24 mm/h、CRP 8 mg/L",
              "items": [
                [
                  "2026-03 ESR",
                  "24 mm/h"
                ],
                [
                  "2026-03 CRP",
                  "8 mg/L"
                ]
              ]
            },
            "imaging": {
              "summary": "颞动脉超声：晕环较前对照变薄",
              "items": [
                [
                  "报告原文",
                  "右颞动脉晕环较前对照变薄（未判读）"
                ]
              ]
            },
            "ae": {
              "summary": "无新增",
              "items": [
                [
                  "说明",
                  "无记录"
                ]
              ]
            },
            "support": {
              "summary": "\"记下来就不慌\"",
              "items": [
                [
                  "患者原话",
                  "把每次的数记下来，去医院就不慌了"
                ]
              ]
            }
          }
        }
      ],
      "labs": [
        {
          "date": "2026-05-08",
          "items": [
            {
              "code": "ESR",
              "value": 39,
              "unit": "mm/h",
              "method": "Westergren（魏氏法）",
              "refLow": 0,
              "refHigh": null,
              "lab": "外院报告（未印上限）"
            },
            {
              "code": "CRP",
              "value": 14,
              "unit": "mg/L",
              "method": null,
              "refLow": 0,
              "refHigh": 8,
              "lab": "区中心医院"
            },
            {
              "code": "Hb",
              "value": 127,
              "unit": "g/L",
              "method": null,
              "refLow": 112,
              "refHigh": 148,
              "lab": "区中心医院"
            },
            {
              "code": "PLT",
              "value": 264,
              "unit": "10⁹/L",
              "method": null,
              "refLow": 120,
              "refHigh": 340,
              "lab": "区中心医院"
            },
            {
              "code": "ALT",
              "value": 31,
              "unit": "U/L",
              "method": null,
              "refLow": 8,
              "refHigh": 45,
              "lab": "区中心医院"
            },
            {
              "code": "FBG",
              "value": 6.1,
              "unit": "mmol/L",
              "method": null,
              "refLow": 3.9,
              "refHigh": 6.1,
              "lab": "区中心医院"
            },
            {
              "code": "SBP",
              "value": 140,
              "unit": "mmHg",
              "method": "诊室血压测量",
              "refLow": null,
              "refHigh": null,
              "lab": "区中心医院"
            },
            {
              "code": "DBP",
              "value": 78,
              "unit": "mmHg",
              "method": "诊室血压测量",
              "refLow": null,
              "refHigh": null,
              "lab": "区中心医院"
            }
          ]
        },
        {
          "date": "2026-06-08",
          "items": [
            {
              "code": "ESR",
              "value": 33,
              "unit": "mm/h",
              "method": "Westergren（魏氏法）",
              "refLow": 0,
              "refHigh": 20,
              "lab": "区中心医院"
            },
            {
              "code": "CRP",
              "value": 11,
              "unit": "mg/L",
              "method": null,
              "refLow": 0,
              "refHigh": 8,
              "lab": "区中心医院"
            },
            {
              "code": "Hb",
              "value": 130,
              "unit": "g/L",
              "method": null,
              "refLow": 112,
              "refHigh": 148,
              "lab": "区中心医院"
            },
            {
              "code": "PLT",
              "value": 252,
              "unit": "10⁹/L",
              "method": null,
              "refLow": 120,
              "refHigh": 340,
              "lab": "区中心医院"
            },
            {
              "code": "ALT",
              "value": 34,
              "unit": "U/L",
              "method": null,
              "refLow": 8,
              "refHigh": 45,
              "lab": "区中心医院"
            },
            {
              "code": "FBG",
              "value": 5.8,
              "unit": "mmol/L",
              "method": null,
              "refLow": 3.9,
              "refHigh": 6.1,
              "lab": "区中心医院"
            },
            {
              "code": "SBP",
              "value": 133,
              "unit": "mmHg",
              "method": "诊室血压测量",
              "refLow": null,
              "refHigh": null,
              "lab": "区中心医院"
            },
            {
              "code": "DBP",
              "value": 78,
              "unit": "mmHg",
              "method": "诊室血压测量",
              "refLow": null,
              "refHigh": null,
              "lab": "区中心医院"
            }
          ]
        },
        {
          "date": "2026-07-08",
          "items": [
            {
              "code": "ESR",
              "value": 30,
              "unit": "mm/h",
              "method": "Westergren（魏氏法）",
              "refLow": 0,
              "refHigh": 20,
              "lab": "区中心医院"
            },
            {
              "code": "CRP",
              "value": 9,
              "unit": "mg/L",
              "method": null,
              "refLow": 0,
              "refHigh": 8,
              "lab": "区中心医院"
            },
            {
              "code": "Hb",
              "value": 131,
              "unit": "g/L",
              "method": null,
              "refLow": 112,
              "refHigh": 148,
              "lab": "区中心医院"
            },
            {
              "code": "PLT",
              "value": 246,
              "unit": "10⁹/L",
              "method": null,
              "refLow": 120,
              "refHigh": 340,
              "lab": "区中心医院"
            },
            {
              "code": "ALT",
              "value": 43,
              "unit": "U/L",
              "method": null,
              "refLow": 8,
              "refHigh": 45,
              "lab": "区中心医院"
            },
            {
              "code": "FBG",
              "value": 6.3,
              "unit": "mmol/L",
              "method": null,
              "refLow": 3.9,
              "refHigh": 6.1,
              "lab": "区中心医院"
            },
            {
              "code": "SBP",
              "value": 132,
              "unit": "mmHg",
              "method": "诊室血压测量",
              "refLow": null,
              "refHigh": null,
              "lab": "区中心医院"
            },
            {
              "code": "DBP",
              "value": 79,
              "unit": "mmHg",
              "method": "诊室血压测量",
              "refLow": null,
              "refHigh": null,
              "lab": "区中心医院"
            }
          ]
        },
        {
          "date": "2026-08-08",
          "items": [
            {
              "code": "ESR",
              "value": 26,
              "unit": "mm/h",
              "method": "Westergren（魏氏法）",
              "refLow": 0,
              "refHigh": 20,
              "lab": "区中心医院"
            },
            {
              "code": "CRP",
              "value": 8,
              "unit": "mg/L",
              "method": null,
              "refLow": 0,
              "refHigh": 8,
              "lab": "区中心医院"
            },
            {
              "code": "Hb",
              "value": 128,
              "unit": "g/L",
              "method": null,
              "refLow": 112,
              "refHigh": 148,
              "lab": "区中心医院"
            },
            {
              "code": "PLT",
              "value": 246,
              "unit": "10⁹/L",
              "method": null,
              "refLow": 120,
              "refHigh": 340,
              "lab": "区中心医院"
            },
            {
              "code": "ALT",
              "value": 37,
              "unit": "U/L",
              "method": null,
              "refLow": 8,
              "refHigh": 45,
              "lab": "区中心医院"
            },
            {
              "code": "FBG",
              "value": 5.9,
              "unit": "mmol/L",
              "method": null,
              "refLow": 3.9,
              "refHigh": 6.1,
              "lab": "区中心医院"
            },
            {
              "code": "SBP",
              "value": 129,
              "unit": "mmHg",
              "method": "诊室血压测量",
              "refLow": null,
              "refHigh": null,
              "lab": "区中心医院"
            },
            {
              "code": "DBP",
              "value": 80,
              "unit": "mmHg",
              "method": "诊室血压测量",
              "refLow": null,
              "refHigh": null,
              "lab": "区中心医院"
            }
          ]
        },
        {
          "date": "2026-09-08",
          "items": [
            {
              "code": "ESR",
              "value": 24,
              "unit": "mm/h",
              "method": "Westergren（魏氏法）",
              "refLow": 0,
              "refHigh": 20,
              "lab": "区中心医院"
            },
            {
              "code": "CRP",
              "value": 7,
              "unit": "mg/L",
              "method": null,
              "refLow": 0,
              "refHigh": 8,
              "lab": "区中心医院"
            },
            {
              "code": "Hb",
              "value": 123,
              "unit": "g/L",
              "method": null,
              "refLow": 112,
              "refHigh": 148,
              "lab": "区中心医院"
            },
            {
              "code": "PLT",
              "value": 245,
              "unit": "10⁹/L",
              "method": null,
              "refLow": 120,
              "refHigh": 340,
              "lab": "区中心医院"
            },
            {
              "code": "ALT",
              "value": 34,
              "unit": "U/L",
              "method": null,
              "refLow": 8,
              "refHigh": 45,
              "lab": "区中心医院"
            },
            {
              "code": "FBG",
              "value": 5.9,
              "unit": "mmol/L",
              "method": null,
              "refLow": 3.9,
              "refHigh": 6.1,
              "lab": "区中心医院"
            },
            {
              "code": "SBP",
              "value": 127,
              "unit": "mmHg",
              "method": "诊室血压测量",
              "refLow": null,
              "refHigh": null,
              "lab": "区中心医院"
            },
            {
              "code": "DBP",
              "value": 79,
              "unit": "mmHg",
              "method": "诊室血压测量",
              "refLow": null,
              "refHigh": null,
              "lab": "区中心医院"
            }
          ]
        },
        {
          "date": "2026-10-08",
          "items": [
            {
              "code": "ESR",
              "value": 25,
              "unit": "mm/h",
              "method": "Westergren（魏氏法）",
              "refLow": 0,
              "refHigh": 20,
              "lab": "区中心医院"
            },
            {
              "code": "CRP",
              "value": 8,
              "unit": "mg/L",
              "method": null,
              "refLow": 0,
              "refHigh": 8,
              "lab": "区中心医院"
            },
            {
              "code": "Hb",
              "value": 128,
              "unit": "g/L",
              "method": null,
              "refLow": 112,
              "refHigh": 148,
              "lab": "区中心医院"
            },
            {
              "code": "PLT",
              "value": 251,
              "unit": "10⁹/L",
              "method": null,
              "refLow": 120,
              "refHigh": 340,
              "lab": "区中心医院"
            },
            {
              "code": "ALT",
              "value": 36,
              "unit": "U/L",
              "method": null,
              "refLow": 8,
              "refHigh": 45,
              "lab": "区中心医院"
            },
            {
              "code": "FBG",
              "value": 5.9,
              "unit": "mmol/L",
              "method": null,
              "refLow": 3.9,
              "refHigh": 6.1,
              "lab": "区中心医院"
            },
            {
              "code": "SBP",
              "value": 134,
              "unit": "mmHg",
              "method": "诊室血压测量",
              "refLow": null,
              "refHigh": null,
              "lab": "区中心医院"
            },
            {
              "code": "DBP",
              "value": 81,
              "unit": "mmHg",
              "method": "诊室血压测量",
              "refLow": null,
              "refHigh": null,
              "lab": "区中心医院"
            }
          ]
        }
      ]
    }
  ],
  "trialMatch": {
    "A": [
      {
        "pct": 50,
        "band": "needs_info",
        "bandLabel": "需补充信息",
        "hardUnmet": 0,
        "hardUnmetRules": [],
        "recordId": "t1",
        "title": "【虚构示例】GCA 症状负担登记研究",
        "sourceId": "ctgov",
        "recruitmentStatus": "登记状态，未核实",
        "statusNote": "登记 ≠ 有效 ≠ 安全 ≠ 可入组",
        "healthyVolunteer": false,
        "counts": {
          "satisfied": 1,
          "conflict": 0,
          "undetermined": 1
        },
        "decidable": 1,
        "total": 2,
        "rows": [
          {
            "tier": "satisfied",
            "rule": "入选：登记病种与本人诊断一致",
            "mine": "巨细胞动脉炎（GCA）",
            "hard": true,
            "source": "本工作台只服务 GCA 患者",
            "why": "条目要求\"有这一项\"，本机记录：巨细胞动脉炎（GCA）"
          },
          {
            "tier": "undetermined",
            "rule": "纳入 / 排除标准原文",
            "mine": null,
            "source": null,
            "why": "本项目采集只到标题/登记号/状态，未抓纳入排除原文——这一条必须回去看登记页"
          }
        ]
      }
    ],
    "B": [
      {
        "pct": 50,
        "band": "needs_info",
        "bandLabel": "需补充信息",
        "hardUnmet": 0,
        "hardUnmetRules": [],
        "recordId": "t1",
        "title": "【虚构示例】GCA 长期随访观察研究",
        "sourceId": "ictrp",
        "recruitmentStatus": "登记状态，未核实",
        "statusNote": "登记 ≠ 有效 ≠ 安全 ≠ 可入组",
        "healthyVolunteer": false,
        "counts": {
          "satisfied": 1,
          "conflict": 0,
          "undetermined": 1
        },
        "decidable": 1,
        "total": 2,
        "rows": [
          {
            "tier": "satisfied",
            "rule": "入选：登记病种与本人诊断一致",
            "mine": "巨细胞动脉炎（GCA）",
            "hard": true,
            "source": "本工作台只服务 GCA 患者",
            "why": "条目要求\"有这一项\"，本机记录：巨细胞动脉炎（GCA）"
          },
          {
            "tier": "undetermined",
            "rule": "纳入 / 排除标准原文",
            "mine": null,
            "source": null,
            "why": "本项目采集只到标题/登记号/状态，未抓纳入排除原文——这一条必须回去看登记页"
          }
        ]
      },
      {
        "pct": 50,
        "band": "needs_info",
        "bandLabel": "需补充信息",
        "hardUnmet": 0,
        "hardUnmetRules": [],
        "recordId": "t2",
        "title": "【虚构示例】GCA 复发频率与托珠单抗研究",
        "sourceId": "ctgov",
        "recruitmentStatus": "登记状态，未核实",
        "statusNote": "登记 ≠ 有效 ≠ 安全 ≠ 可入组",
        "healthyVolunteer": false,
        "counts": {
          "satisfied": 1,
          "conflict": 0,
          "undetermined": 1
        },
        "decidable": 1,
        "total": 2,
        "rows": [
          {
            "tier": "satisfied",
            "rule": "入选：登记病种与本人诊断一致",
            "mine": "巨细胞动脉炎（GCA）",
            "hard": true,
            "source": "本工作台只服务 GCA 患者",
            "why": "条目要求\"有这一项\"，本机记录：巨细胞动脉炎（GCA）"
          },
          {
            "tier": "undetermined",
            "rule": "纳入 / 排除标准原文",
            "mine": null,
            "source": null,
            "why": "本项目采集只到标题/登记号/状态，未抓纳入排除原文——这一条必须回去看登记页"
          }
        ]
      }
    ]
  },
  "snapshotMeta": {
    "snapshotDate": "2026-11-14",
    "recordCount": 221,
    "relevant": 149,
    "sources": [
      {
        "id": "chictr_online",
        "state": "failed",
        "queried": 0
      },
      {
        "id": "chictr_pancreatic_archive",
        "state": "unconfigured",
        "queried": 0
      },
      {
        "id": "chinadrugtrials",
        "state": "ready",
        "queried": 1
      },
      {
        "id": "ctv",
        "state": "ready",
        "queried": 1
      },
      {
        "id": "ictrp",
        "state": "truncated",
        "queried": 1
      },
      {
        "id": "xyb_chinadrugtrials_archive",
        "state": "ready",
        "queried": 1
      }
    ],
    "honestyNote": "只有 SUCCESS 与 NO_RESULTS 表示该来源真的被查询并给出答案；其余终态一律不代表\"没有试验\""
  }
}
  root.DEMO = DEMO
})(typeof window !== 'undefined' ? window : globalThis)
