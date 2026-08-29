import Link from "next/link";

type ConstitutionNode = {
  marker: string;
  text: string;
  children?: ConstitutionNode[];
};

type ConstitutionArticle = {
  number: number;
  title: string;
  partLabel?: string;
  nodes: ConstitutionNode[];
};

type ConstitutionChapter = {
  heading: string;
  articles: ConstitutionArticle[];
};

const chapters: ConstitutionChapter[] = [
  {
    heading: "Chapter One.",
    articles: [
      {
        number: 1,
        title: "The Name",
        nodes: [
          {
            marker: "(1)",
            text: "There shall exist this association, and shall be identified as the UGENYA ASSOCIATION (KENYA) hereafter referred to as association.",
          },
        ],
      },
      {
        number: 2,
        title: "Jurisdiction and language",
        nodes: [
          { marker: "i.", text: "The association shall conduct its functions and operations in Uasin Gishu County." },
          { marker: "ii.", text: "Shall have its branches within Eldoret and or other areas within the county of Uasin Gishu." },
          { marker: "iii.", text: "May extend its functions and operations to other counties within Kenya." },
          { marker: "iv.", text: "Subject to the application of clause (3), Eldoret shall be the administrative center." },
          { marker: "v.", text: "Shall uphold the rule of law and confine itself within the laws of the country." },
        ],
      },
      {
        number: 3,
        title: "Language",
        nodes: [
          { marker: "(1)", text: "The official language will be dholuo." },
          { marker: "(2)", text: "Other languages will be English and Kiswahili." },
        ],
      },
    ],
  },
  {
    heading: "Chapter three",
    articles: [
      {
        number: 4,
        title: "The objectives of this Association shall be:",
        nodes: [
          { marker: "i.", text: "To improve members' Economic status through investments and other development programs." },
          { marker: "ii.", text: "To encourage the good will an involvement of the wider community." },
          { marker: "iii.", text: "To create awareness in matters of development social, economic and global changes through seminars." },
          { marker: "iv.", text: "Assist in matters affecting members' welfare as may be referred in the constitution or any other written law." },
          { marker: "v.", text: "Promote cohesion among members and other citizens." },
        ],
      },
      {
        number: 5,
        title: "Application and registration.",
        nodes: [
          {
            marker: "(1)",
            text: "Membership shall be open and voluntary to any interested person from Ugenya, and who has an interest in assisting the association to achieve its objectives.",
          },
          {
            marker: "(2)",
            text: "Any member joining the association Shall:-",
            children: [
              { marker: "a.", text: "Appear in person with one referee who is also a registered member." },
              { marker: "b.", text: "Be an adult of 18 years and above." },
              { marker: "c.", text: "Register in a branch within their residential jurisdiction" },
              { marker: "d.", text: "Complete membership application forms indicating his nucleus family at their respective branches." },
              { marker: "e.", text: "With respect to clause (d), nucleus family refers to father, mother and their children." },
              { marker: "f.", text: "With the respect to clause (2) (d), pay in advance annual subscription membership fee." },
            ],
          },
          { marker: "(3)", text: "All application duly completed shall be recommended by branch chairman and subject to approval by the executive chairperson." },
          {
            marker: "(4)",
            text: "Whether the executive chairperson approve/rejected the application, he/she shall within thirty days before the next branch meeting communicate his or her decision to the respective branch(s).",
          },
          {
            marker: "(5)",
            text: "Subject to reference made to person(s) under article (5)(1), any person(s) whose residence in the referred area was as a result of land acquisition through purchase or otherwise, shall seek authorization in writing to the executive chairperson, through the secretary, this notwithstanding provision in article 5(2)",
          },
          { marker: "(6)", text: "In pursuance to article 5(2) (d) a fee shall be charged to all applications." },
          { marker: "(7)", text: "Such fees and any other payments shall be determined by the general committee." },
          { marker: "(8)", text: "Membership shall be renewed annually" },
          { marker: "(9)", text: "A person applying for membership shall after the approval of such application pay membership fee." },
          {
            marker: "(10)",
            text: "Any member(s) who shall upon the expiry of their membership and within a period of sixty days after such expiry does not renew their membership, shall automatically lose their membership rights.",
          },
          {
            marker: "(11)",
            text: "Persons referred to article 5(1) are:-",
            children: [
              { marker: "a.", text: "Single or married men from Ugenya (jougenya)" },
              { marker: "b.", text: "Single or unmarried woman from Ugenya (nyaugenya)" },
              { marker: "c.", text: "Widows of persons referred to clause (11) (a)" },
              { marker: "d.", text: "Only under conditional circumstances shall a female member married to persons referred to clause (11) (a) be allowed to register on their behalf." },
              { marker: "e.", text: "Any member not specified under this article shall be determined and approved by the GC." },
              { marker: "f.", text: "If a member is before or after registration polygamous, this association shall only recognize first two of the member's spouses." },
            ],
          },
        ],
      },
      {
        number: 6,
        title: "Resignation, suspension and termination of membership.",
        nodes: [
          { marker: "(1)", text: "Any members of the association may resign his/her membership and any representative position by giving to the secretary of the association written notice effect." },
          {
            marker: "(2)",
            text: "The management committee may, by a resolution passed at a meeting there of term or suspend the membership of any member, f in its opinion his/ her, condition is prejudicial to the interest and objects of the association with respect to article (32 (17).)",
          },
          { marker: "(3)", text: "A member shall have the right to be heard by the general committee before the final decision is made." },
          { marker: "(4)", text: "There shall be a right to appeal to an independent arbitration appointed by mutual agreement of the management committee." },
          { marker: "(5)", text: "A member under suspension shall be deemed as a non-member for the period affected by the suspension." },
        ],
      },
      {
        number: 7,
        title: "Association values and principals of leadership.",
        nodes: [
          {
            marker: "(1)",
            text: "The association values and principals of leadership in this article bind all branches, all officials committee and all members whenever any of them:-",
            children: [
              { marker: "(a)", text: "Applies or interprets this constitution." },
              { marker: "(b)", text: "Applies or interprets any law." },
            ],
          },
          {
            marker: "(2)",
            text: "The association values and principals of leadership include:",
            children: [
              { marker: "(a)", text: "Unity, participation of members, inclusiveness, rights, non-discrimination." },
              { marker: "(b)", text: "Good leadership, integrity, transparency and accountability." },
            ],
          },
          { marker: "(3)", text: "Sustainable development programs." },
        ],
      },
      {
        number: 8,
        title: "Membership obligations and rights.",
        nodes: [
          {
            marker: "(1)",
            text: "Members have the obligation to: -",
            children: [
              { marker: "(a)", text: "Basically understand the provisions of this constitution and promote its objectives and ideas." },
              { marker: "(b)", text: "Promote good relationship and respect the rules as stipulated in this constitution and any other written law." },
              { marker: "(c)", text: "Support projects undertaken by the associations as may be approved by general committee from time to time." },
              { marker: "(d)", text: "Pay any fee or any other contribution as may be guided by this constitution." },
            ],
          },
          {
            marker: "(2)",
            text: "Every member:",
            children: [
              { marker: "(a)", text: "Is entitled to the rights to privileges and benefits of membership subject to the limits of this constitution." },
              { marker: "(b)", text: "Is entitled to association membership card and to any document of identification or any other document as it may be applicable." },
              { marker: "(c)", text: "Entitled to vote for their choice of candidate in any association's elections." },
              { marker: "(d)", text: "Has a right to be elected to organs of this association subjected to this constitution." },
              { marker: "(e)", text: "Has a right to own part of investment through purchase of shares." },
              {
                marker: "(f)",
                text: "Subject to provision of clause (e) a member may wish to withdraw his/ her shareholding from the association a written notice of up to 60 days of his/ her Intention to withdraw the same or to sell to a willing buyer.",
              },
              { marker: "(g)", text: "Has a right to nominate his/her next of kin as provide under article 10 of this constitution." },
            ],
          },
          { marker: "(3)", text: "In case of death of a member, the association shall meet funeral expenses as provided under welfare by-laws of this association." },
        ],
      },
      {
        number: 9,
        title: "Retention of Existing membership.",
        nodes: [
          { marker: "(1)", text: "Every person who was an active member immediately before the effective date of this constitution retains the membership status as of that date." },
          { marker: "(2)", text: "Person(s) who three months before the effective date of the constitution were inactive due to incapacitation." },
          { marker: "(3)", text: "Subject to clause 2 article 5(10) shall be applied after effective date of this constitution." },
        ],
      },
      {
        number: 10,
        title: "Next of kin.",
        nodes: [
          { marker: "(1)", text: "Members shall nominate their next of kin who shall assume responsibilities in case of his/ her death or incapacitation." },
          {
            marker: "(2)",
            text: "Responsibilities referred to in the above clause are: -",
            children: [
              { marker: "(a)", text: "Shares owned by the member if any." },
              { marker: "(b)", text: "Savings under members name if any." },
              { marker: "(c)", text: "Any other asset under custody of the association held on behalf of the member." },
            ],
          },
          { marker: "(3)", text: "If the nominee is under l8yrs of age subject to provision of this article, the association through the trustee, shall on behalf of the minor, undertake and manage such responsibilities." },
          { marker: "(4)", text: "In exercising the powers under article 22 (1) (d), any decision therefore made by the trustee shall be reasonable considering interest of other members of the deceased family." },
        ],
      },
      {
        number: 11,
        title: "Voluntary withdrawal of membership.",
        nodes: [
          { marker: "(1)", text: "Any member may opt to voluntarily withdraw his or her membership." },
          { marker: "(2)", text: "Shall be required to submit a written notification of his intentions to the general secretary through their branch leadership." },
          { marker: "(3)", text: "Management committee shall within 30 days from their receipt of notification, direct its decision in writing to the respective branch." },
          { marker: "(4)", text: "The association shall refund to the member all his/ her refundable contribution or savings as directed under this constitution or any other written laws of this association." },
        ],
      },
      {
        number: 12,
        title: "Membership deprivation.",
        nodes: [
          {
            marker: "(1)",
            text: "A member may be deprived of their membership for:.",
            children: [
              { marker: "(a)", text: "Gross misconduct." },
              { marker: "(b)", text: "Not participating in the activities of this association as stipulated." },
              { marker: "(c)", text: "Divulging association secrets and undermining elected or any official of the association." },
              {
                marker: "(d)",
                text: "Misuse of association fund, member's contributions or any money pertaining to the above mentioned or any other collection as the case may seem.",
              },
              { marker: "(f)", text: "Not complying with article 5(10) of this constitution." },
            ],
          },
        ],
      },
    ],
  },
  {
    heading: "Chapter five",
    articles: [
      {
        number: 13,
        title: "Management committee (executive) power and duties.",
        nodes: [
          { marker: "(1)", text: "Powers to manage the affairs of this association is vested in the management committee the (executive)" },
          {
            marker: "(2)",
            text: "The association shall be administered by a management committee of not less than ('3,) three people and not more than 10 ten persons, who must be at least (l8yrs) eighteen years of age and above.",
          },
          { marker: "(3)", text: "Terms of office for all elected members shall be maximum six years of three year term but may be re-elected at the groups AGM." },
          {
            marker: "(4)",
            text: "The management committee shall consist of",
            children: [
              { marker: "(a)", text: "Chairman" },
              { marker: "(b)", text: "Deputy Chairman." },
              { marker: "(c)", text: "Secretary General" },
              { marker: "(d)", text: "Treasurer" },
              { marker: "(e)", text: "Organizing secretary" },
              { marker: "(f)", text: "Assisting secretary" },
              { marker: "(g)", text: "Assisting treasurer." },
            ],
          },
          {
            marker: "",
            text: "And any other officer the group deems to be necessary to carry out the associations activities. Trustee and internal auditor shall not be member of the management committee.",
          },
          {
            marker: "(1)",
            text: "In furtherance to the objective, but not otherwise, the management committee may exercise the powers to generally manage the affairs of Ugenya association and to",
            children: [
              { marker: "(a)", text: "Promote living standard and well-being of members by investing in meaningful, sustainable and viable development projects." },
              { marker: "(b)", text: "Invite and receive contributions and raise funds where appropriate, to finance the work of this association." },
              { marker: "(c)", text: "To open bank account and to manage such funds." },
              { marker: "(d)", text: "Promote the work of the association and organize meetings e. t. c" },
              { marker: "(e)", text: "Working with groups of similar nature and exchange information advice and knowledge with them." },
              { marker: "(f)", text: "Cooperating with other statutory bodies and Organizations." },
              {
                marker: "(g)",
                text: "May employ paid staff(s) or volunteers who shall not be members of the management committee as are necessary to conduct activities to meet the objectives.",
              },
              { marker: "(h)", text: "May buy or rent premises/ equipment" },
              { marker: "(i)", text: "Receive contributions through membership fee and any other contributions." },
              {
                marker: "(j)",
                text: "Institute fees and subscriptions payable by members and decide such levies, fines and charges as necessary and advisable, and to enforce payment thereof",
              },
              { marker: "(k)", text: "Clause (5) (g) (h) and (i) of article 13 shall be subject to approval by the general committee." },
              { marker: "(l)", text: "Shall observe in all activities, the provisions of this constitution and" },
              { marker: "(n)", text: "Ensure that true and accurate records of accounts are kept, comprising of money, properties, liabilities, income and expenditures." },
              { marker: "(o)", text: "Ensure that the activities of the association are within the laws of the country and detach itself from politics." },
              { marker: "(p)", text: "Shall formulate and apply all its administrative rules and regulations for the purposes of its effective management." },
              { marker: "(q)", text: "Ensure all development projects are cost effective and beneficial to its members" },
              { marker: "(r)", text: "Shall inform the general committee on any new investment plan." },
              {
                marker: "(s)",
                text: "Adjudicate and act conclusively on all matters referred to it by either of the functional committee or branches, and may nulify, stop or cause to leave office any official (s) from any of association's branches f in its opinion.",
                children: [
                  { marker: "(i)", text: "There is sufficient evidence that elections were flawed." },
                  { marker: "(ii)", text: "The officer has violated provisions of this constitution." },
                ],
              },
              { marker: "(t)", text: "May arbitrate on issues likely to endanger the activities of this association." },
              { marker: "(u)", text: "Determine its cases and communicate within a period of thirty (30) days from the time of receipt of such case." },
              { marker: "(v)", text: "Nominate an auditor internal to be approved by general committee." },
              { marker: "(w)", text: "Shall issue same certificate to share holder of the investments." },
              { marker: "(x)", text: "All certificates shall bare association seal for authentication." },
            ],
          },
        ],
      },
      {
        number: 14,
        title: "Responsibilities and election of executive chairperson.",
        nodes: [
          { marker: "(a)", text: "To preside over all management committee (executive) and investment committee meetings as provided in article 23 (5)" },
          { marker: "(b)", text: "Shall on behalf of the association, engage in discussions for the purpose of unity, prosperity in development as referred in article 13 (5) (d) (e) (f)" },
          {
            marker: "(c)",
            text: "The chairperson may invite any person to either of the committee, if in the opinion of the chairperson, a matter has arisen or likely to arise at the meeting that requires the attendance and participation of that person.",
          },
          { marker: "(d)", text: "A person invited to such a meeting under clause (1) (c), shall be bound by the procedures and practices of the committee, but shall not be entitled to vote at any matter" },
          { marker: "(e)", text: "May reject upon receipt any invitation in written after consulting with his management committee if such invitation is inconsistent of this constitution." },
          {
            marker: "(f)",
            text: "Subject to his absence or incapacitation, the deputy shall assume the office of the chairperson but only if:",
            children: [
              { marker: "(i)", text: "In such period of absence or incapacitation is anticipated to inconvenience the operations of association and thereby affect its objectives." },
            ],
          },
          { marker: "(g)", text: "Shall have authority to appoint a subcommittee or nominate any member of the association as it may be convenient and relevant to the objectives, subjects to the provision of this constitution." },
          { marker: "(h)", text: "In the event the executive chairperson dies, the deputy chairperson shall with immediate effect assume the office." },
          {
            marker: "(2)",
            text: "Election of executive chairperson.",
            children: [
              { marker: "(a)", text: "Shall be elected by the members of the association in elections conducted in accordance with this constitution and any other law regulating the executive elections" },
              {
                marker: "(b)",
                text: "An election of the executive chairperson shall be held:-",
                children: [
                  { marker: "i.", text: "On the same day during the AGM being fourth Sunday in November every third year or:" },
                  { marker: "ii.", text: "In the circumstances of death." },
                  { marker: "iii.", text: "Maybe contemplated in this article. 14 (6)(a)(b)" },
                ],
              },
            ],
          },
          {
            marker: "(3)",
            text: "Qualification for elections as executive chairperson",
            children: [
              {
                marker: "(a)",
                text: "A person qualifies for nomination as a candidate if the person:",
                children: [
                  { marker: "i.", text: "Is a member of the association." },
                  { marker: "ii.", text: "Have no arrears on monthly membership fee contribution." },
                  { marker: "iii.", text: "Pay in advance monthly membership fee for the three years." },
                  { marker: "iv.", text: "Active with respect to provision of article 8 (1) (a)(b)(c)(d)" },
                  { marker: "v.", text: "Is nominated by his or her branch" },
                  { marker: "vi.", text: "Is thirty seven years and above" },
                ],
              },
            ],
          },
          {
            marker: "(4)",
            text: "A person is not qualified if:",
            children: [
              { marker: "(a)", text: "Does not satisfy the requirements of this constitution with respect to related provisions" },
              { marker: "(b)", text: "Is an official to rival group" },
            ],
          },
          {
            marker: "(5)",
            text: "Procedure to executive elections.",
            children: [
              { marker: "(a)", text: "If only one candidate for executive chairperson is nominated, the candidate shall be declared elected" },
              { marker: "(b)", text: "If two or more candidates are nominated, an election shall be conducted." },
              { marker: "(c)", text: "Any interested candidate shall be nominated by their branches." },
              { marker: "(d)", text: "Clause 3 shall apply to all candidates aspiring to serve the Association" },
              { marker: "(e)", text: "In case of a tie, the returning officer shall give an hour break before a repeat election is conducted." },
              { marker: "(f)", text: "The person who receives more votes will be declared elected." },
            ],
          },
          {
            marker: "(6)",
            text: "Removal from office",
            children: [
              { marker: "(a)", text: "On gross violation of the provisions of this constitution or any other law." },
              {
                marker: "(b)",
                text: "incapable of performing the functions of his office as a result of incapacitation due to physical or mental as the case may direct or fraud, corruption misuse of office.",
              },
              { marker: "(c)", text: "A member of general committee supported by at least quarter of the members, may request for an enquiry to the general committee for investigation" },
              {
                marker: "(d)",
                text: "If the petition in clause (6) (c) is supported by two thirds of the members of the committee, a team of four members shall be appointed under the leadership of the trustee to look into the matter, two of whom do not sit in any of the committees.",
              },
              { marker: "(e)", text: "The sub-committee shall enquire into the matter and within thirty days after the appointment, submit its report to the chairman during a sitting." },
              {
                marker: "(I)",
                text: "The report of the sub-committee shall be final and not subject to appeal, f the executive chairman is found to be capable of performing his duties, the acting chairman. Shall so announce to the general committee.",
              },
              { marker: "(j)", text: "If found capable of performing his duties of the office, the general committee shall vote to adopt the report of the subcommittee." },
              { marker: "(k)", text: "If the majority or two thirds of general committee members vote in favor of the adoption of the report, the executive chairperson shall cease to hold the office." },
            ],
          },
        ],
      },
      {
        number: 15,
        title: "Deputy Chairperson.",
        nodes: [
          { marker: "(1)", text: "The deputy chairperson shall be the principal assistant of the chairperson and shall deputize for the chairman in the execution of the chairperson's functions." },
          { marker: "(2)", text: "The deputy chairman shall perform the functions conferred by this constitution and other functions of the chairperson as the chairperson may assign." },
          {
            marker: "(3)",
            text: "Subject to article 14, when the chairman is absent or is temporary incapacitated, and during any other period that the chairperson decides the deputy shall act as the executive chairman.",
          },
        ],
      },
      {
        number: 16,
        title: "Election of deputy Chairperson.",
        nodes: [
          { marker: "(1)", text: "For the purpose of clause (2), there shall be no separate nomination process for the deputy chairman." },
          { marker: "(2)", text: "The presiding officer with the responsibility to conduct the elections shall declare the candidate nominated by the person who is elected as the chairperson." },
          { marker: "(3)", text: "Each candidate contesting in chairperson's election shall nominate person who is qualified for nomination for election as a chairperson as a candidate for deputy chairperson." },
          {
            marker: "(4)",
            text: "Term of office and the date of taking over of the office by the chairperson, shall start:",
            children: [
              { marker: "(a)", text: "When the person next elected chairperson of the association assumes the office." },
              { marker: "(b)", text: "On the deputy chairperson assuming office of the chairperson subject to article 14" },
              { marker: "(c)", text: "On the resignation, death or removal from office of the deputy chairperson." },
            ],
          },
          {
            marker: "(5)",
            text: "In the event of a vacancy in the office of the deputy chairperson within fourteen days the chairperson shall nominate a person to fill the vacancy, notwithstanding provisions in clause (3), and general committee shall vote on the nomination within sixty days after receiving it.",
          },
          { marker: "(6)", text: "The provision of article 14 (6) relating to the removal of chairperson shall apply with the necessary modifications, to the removal of deputy chairperson." },
        ],
      },
      {
        number: 17,
        title: "Secretary General",
        nodes: [
          {
            marker: "(1)",
            text: "The secretary shall:",
            children: [
              { marker: "(a)", text: "Be in charge of all correspondence both internally and externally as may be directed by the executive." },
              { marker: "(b)", text: "Be responsible in the day to day business of the association with respect to all committees by the organizing business meetings and taking minutes." },
              { marker: "(c)", text: "Communicate in writing to all stake holders within seven days after any official meetings the decision as may be appropriate." },
              { marker: "(d)", text: "May resign from office in writing to the general committee through the chairperson." },
              { marker: "(e)", text: "The general committee may reject the request if the reasons given are not satisfactory." },
              { marker: "(f)", text: "May be removed subject to article 14 (6)" },
              { marker: "(g)", text: "If the office of secretary general ceases to function as in provisions of article 14 (l) (/), the deputy secretary general shall assume the office" },
              { marker: "(h,)", text: "Is a signatory to the association's accounts." },
            ],
          },
        ],
      },
      {
        number: 18,
        title: "Deputy Secretary General.",
        nodes: [
          { marker: "(1)", text: "Shall deputize the secretary general subject to similar provisions of article (15) (1)." },
          { marker: "(2)", text: "Any elected official may be removed from office if provisions of this constitution is breached with respect to their functions." },
        ],
      },
      {
        number: 19,
        title: "Treasurer.",
        nodes: [
          {
            marker: "(1)",
            text: "The treasurer shall:",
            children: [
              { marker: "(a)", text: "Be the person in charge of all the finances of the association." },
              { marker: "(b)", text: "Be responsible for all credit banking and withdrawals" },
              {
                marker: "(c)",
                text: "Adhere to the principal of transparency and accountability and observance of associations regulations, including instituting appropriate controls and oversight over borrowing and expenditure",
              },
              { marker: "(d)", text: "Prepare and submit to the general committee, half year's financial report within thirty days after the period ending December of every year." },
              { marker: "(e)", text: "Prepare and submit to the general committee, full year's audited financial report on every third Sunday of every month of August not withstanding provisions of article 24 (10)" },
              { marker: "(f)", text: "Obtain and attach bank statements for the purpose of clause (1)(e) above." },
            ],
          },
        ],
      },
      {
        number: 20,
        title: "Organizing Secretary.",
        nodes: [
          {
            marker: "(1)",
            text: "The office of the organizing secretary shall:-",
            children: [
              {
                marker: "(a)",
                text: "Be responsible in organizing all activities related to the association, such activities shall include.",
                children: [
                  { marker: "(i)", text: "Organizing venues for meeting etc." },
                  { marker: "(ii)", text: "Rules and procedures for conducting meetings and other related activities." },
                  { marker: "(iii)", text: "Ensure al/license and permits are secured on time." },
                ],
              },
            ],
          },
        ],
      },
      {
        number: 21,
        title: "Assistant treasurer.",
        nodes: [
          { marker: "(1)", text: "Assist the treasurer on matters pertaining treasury." },
          { marker: "(2)", text: "Perform other duties as may be assigned by the treasurer except for provisions of article 19 (d) and (e) respectively." },
        ],
      },
      {
        number: 22,
        title: "Trustee.",
        nodes: [
          {
            marker: "(1)",
            text: "Shall be the custodian of all important documents such as: -",
            children: [
              { marker: "(a)", text: "Title deeds, log books" },
              { marker: "(b)", text: "Supervise on behalf of members; assets, finances and viability of any investments." },
              { marker: "(c)", text: "Any other document of properly owned by the association" },
              { marker: "(d)", text: "Shall on behalf of a minor manage shares, savings or assets held by the association on behalf of members as referred in article 10 (3)." },
            ],
          },
        ],
      },
      {
        number: 23,
        title: "Meetings.",
        nodes: [
          { marker: "(1)", text: "All meetings of the association shall be scheduled by the secretary general." },
          {
            marker: "(2)",
            text: "The general committee shall meet after every sixty days, the meetings shall enable the committee discuss actions and monitor progress and to consider future developments.",
          },
          { marker: "(3)", text: "All members shall be given at least seven days' notice of when a meeting is due to take place unless, it is deemed as an emergency." },
          { marker: "(4)", text: "A quorum of two thirds of the committee, members must be present in order for a meeting to take place." },
          {
            marker: "(5)",
            text: "Except for welfare committee and general committee, it shall be the responsibility of the chairperson to chair meetings as provided under article 14 (1) (a) of this constitution, on his absence, delegate the role to his/her deputy.",
          },
          { marker: "(6)", text: "All meetings are minuted and accessible to all branches and interested parties." },
          { marker: "(7)", text: "Except for provisions of clause (2), and welfare committee, other committees shall meet regularly." },
          { marker: "(8)", text: "AGM shall take place the last Sunday of November at least fourteen days notice must be given before the meeting takes place." },
          { marker: "(9)", text: "All members are entitled to vote at the AGM, voting shall be made by secret ballot. In case of tie vote, the chairperson or an appointed deputy shall make the final decision." },
          { marker: "(10)", text: "A special general meeting SGM shall be called by the management committee f in its opinion a matter has arisen and which requires the attention of members." },
        ],
      },
    ],
  },
  {
    heading: "Chapter six. Finance (Part 1) Banking and withdrawals.",
    articles: [
      {
        number: 24,
        title: "Banking.",
        nodes: [
          {
            marker: "(1)",
            text: "Any money acquired by the association or on behalf of the association including donation contributions etc. shall be paid into an account operated by the management committee in the name of the association.",
          },
          {
            marker: "(2)",
            text: "Personal finances and valuables shall not be deposited, neither should any deposit made bearing any initials, name of individual unless: -",
            children: [
              { marker: "(a)", text: "Such deposits f in the context of the association activities are made with respect to purchase of share(s), savings or any other contributions that are admissible and authorized and may be subject to refund." },
            ],
          },
          { marker: "(3)", text: "Non-refundable contribution shall be banked bearing the name of the branch of origin." },
          { marker: "(4)", text: "Disregarding provision in clause (3), the transaction shall be declared void." },
          {
            marker: "(5)",
            text: "With regards to clause (1), no branch of this association shall be allowed to operate any bank account or hold any such account(s) in any institution on behalf of its members or any other agreement of such intentions as the case may be applied.",
          },
          {
            marker: "(6)",
            text: "Operating such account within the association's jurisdiction may:",
            children: [
              { marker: "(a)", text: "Have conflicting interest with the association objective and programs." },
              { marker: "(b)", text: "Subject members to financial stress thereby disables members' ability to participate in development projects and other activities initiated by the Association." },
            ],
          },
          { marker: "(7)", text: "Bank accounts shall be opened in the name of the association." },
          { marker: "(8)", text: "Any income/ expenditure shall be the responsibility of the treasurer who will be accountable to ensure funds are utilized effectively and that the group stays within the budget." },
          { marker: "(9)", text: "Accounts shall be maintained and will be examined annually by an internal or independent auditor who is not a member of the group in the case of external accountant." },
          { marker: "(10)", text: "An annual financial report shall be presented at the AGM and the association accounting year shall run from July to June 30th." },
          {
            marker: "(11)",
            text: "Subject to provisions under article 19 (1) (e), copy of the report shall be circulated to members of association through their representatives in the general committee for deliberation before the AGM, with respect to article 11 above:",
            children: [
              { marker: "(a)", text: "The general committee shall after seven days after receipt of the financial report deliver it to members." },
              { marker: "(b)", text: "Members shall within 91 days from the time of receipt of the report, deliberate and present their response at the AGM" },
              { marker: "(c)", text: "Copies of financial statement, and or other related official correspondence delivered to either of the committee or directly to branches shall be final copy." },
              { marker: "(d)", text: "Members are at liberty to produce a copy of the document." },
            ],
          },
        ],
      },
      {
        number: 12,
        title: "Revenue",
        partLabel: "PART II",
        nodes: [
          { marker: "(1)", text: "All the revenue collected by the association shall be used for the purpose of investing directly or indirectly on behalf of the association." },
          { marker: "(2)", text: "The proceeds of such investments to benefit members directly through disbursement of dividends and indirectly through welfare." },
          { marker: "(3)", text: "An amount of not less than 10% of the total revenue collected from membership annual subscriptions, shall be set aside annually to support welfare programs" },
        ],
      },
      {
        number: 25,
        title: "Withdrawals.",
        nodes: [
          { marker: "(1)", text: "Withdrawal on any association account shall be made on behalf of the association." },
          { marker: "(2)", text: "All budgetary allocations and withdrawal s, shall be subject to authorization by the general committee" },
          { marker: "(3)", text: "Any capital expenditure shall be authorized by the trustee after approval by the general committee." },
          {
            marker: "(4)",
            text: "No such withdrawal as referred in clause (3) shall be made without the authority of the trustee unless: -",
            children: [
              { marker: "(a)", text: "In the opinion of the GC, contemplates prolonged absence of the trustee exceeding fourteen days after approval." },
              { marker: "(b)", text: "On ground of death or certain illness that may render him incapable." },
            ],
          },
          { marker: "(5)", text: "The amount referred in clause (3) shall be determined by the general committee." },
          { marker: "(6)", text: "Any emergency withdrawals shall be made in disregard of clause (2), provided such withdrawals are welfare related." },
          { marker: "(7)", text: "Authorized signatories of the associations Bank Account shall be: Executive chairperson, treasurer and the secretary general." },
        ],
      },
      {
        number: 26,
        title: "Contributions.",
        nodes: [
          {
            marker: "(1)",
            text: "This referrers to either cash or non-cash receivables such contributions include;",
            children: [
              { marker: "(a)", text: "Monthly membership subscription fee." },
              { marker: "(b)", text: "Registration fee." },
              { marker: "(c)", text: "Funeral." },
              { marker: "(d)", text: "Shares movable and immovable items." },
              { marker: "(e)", text: "Any other as may be applicable, provide that such Contributions are consistent with article 4 (1)" },
            ],
          },
          { marker: "(2)", text: "The association may receive non-cash or cash contributions from institutions, individuals or groups, as long as such Contributions are admissible under this constitution." },
          { marker: "(3)", text: "Provisions in clause (1) (a) (b) (c) are not subject to refund." },
        ],
      },
      {
        number: 27,
        title: "Financial secretary.",
        nodes: [
          {
            marker: "(1)",
            text: "There shall exist a financial secretary of this association who shall have the responsibility to: -",
            children: [
              { marker: "(a)", text: "Keep all the financial records" },
              {
                marker: "(b)",
                text: "Prepare all the association's budgets containing:",
                children: [
                  { marker: "(i)", text: "Estimates of income and expenditure, differentiating recurrent and development expenditure." },
                  { marker: "(ii)", text: "Proposals regarding borrowing and other forms of liabilities that will increase association debts." },
                ],
              },
              { marker: "(c)", text: "Coordinate the activities of treasury and other offices and branches as concern finances." },
              { marker: "(d)", text: "Submit all budget estimates to the general committee for allocation." },
            ],
          },
          { marker: "(2)", text: "The person holding such office shall be nominated by the management committee and approved by the general committee." },
          { marker: "(3)", text: "With the reference to clause (2), the office may be dismissed by the chairperson after consulting with general committee." },
        ],
      },
      {
        number: 28,
        title: "Auditor.",
        nodes: [
          {
            marker: "(1)",
            text: "There shall be an auditor of this association who shall be:",
            children: [
              { marker: "(a)", text: "Nominated by the management committee" },
              { marker: "(b)", text: "Independent and discharge his duties in accordance with the sections of this constitution without directions or control of any person or authority." },
              { marker: "(c)", text: "Audit the accounts of the Association and its branches." },
              { marker: "(d)", text: "Audit the existence of the Associations membership at branch level such accounts reports shall be handed to the management committee." },
            ],
          },
          { marker: "(2)", text: "To be qualified to be-i4e auditor, a person shall have knowledge of finance management." },
          { marker: "(3)", text: "The auditor shall hold office subject to article 13(3) and shall be eligible for nomination." },
          {
            marker: "(4)",
            text: "Within six months after the end of every year, the auditor shall audit and report in respect of that financial year on: -",
            children: [
              { marker: "(a)", text: "Association financial accounts" },
              { marker: "(b)", text: "Account on membership" },
              { marker: "(c)", text: "Inventory and property." },
              { marker: "(d)", text: "Association debts." },
            ],
          },
          { marker: "(5)", text: "The auditor may audit and report the accounts of any entity that is funded by the association." },
          { marker: "(6)", text: "An audit report shall confirm whether or not association's savings has been applied lawfully and in an effective way." },
          { marker: "(7)", text: "Audit report shall be submitted to the general committee." },
          { marker: "(8)", text: "Within three months after receiving an audit report. General committee shall debate and consider the report and take appropriate action." },
          { marker: "(9)", text: "Shall advice the treasurer on the financial status and incase of any anomalies and append his signature before the report is presented to the general committee." },
        ],
      },
      {
        number: 29,
        title: "Leadership and integrity.",
        nodes: [
          {
            marker: "(1)",
            text: "The authority assigned to any leader of this association, is to be exercised in a manner that:-",
            children: [
              { marker: "(a)", text: "Is consistent with the purpose and objects of this constitution." },
              { marker: "(b)", text: "Demonstrates respects for members and promote confidence for positive realization of the objectives." },
              {
                marker: "(c)",
                text: "Guided by principles which include:",
                children: [
                  { marker: "(i)", text: "Selection to nomination in the basis of personal integrity, competence and sustainability." },
                  { marker: "(ii)", text: "Objectivity and impartiality in decision making and ensure that decisions are not influenced by favoritism, improper motives or corrupt practices." },
                ],
              },
            ],
          },
          {
            marker: "(2)",
            text: "Subject to provisions of clause (1), (a) (b) (c) any member seeking any elective positions, or before any nomination by the chairperson, shall have:",
            children: [
              {
                marker: "(a)",
                text: "A clean record of membership and:-.",
                children: [
                  { marker: "(i)", text: "Can read and write all official languages a part from dholuo." },
                  { marker: "(ii)", text: "Visionary." },
                  { marker: "(iii)", text: "Has not mismanaged any association resources." },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    heading: "Chapter eight.",
    articles: [
      {
        number: 30,
        title: "Committees.",
        nodes: [
          { marker: "(1)", text: "There is established the standing committee of this association." },
          {
            marker: "(2)",
            text: "The standing committee are:-",
            children: [
              { marker: "(a)", text: "Management committee." },
              { marker: "(b)", text: "General committee." },
              { marker: "(c)", text: "Development committee." },
              { marker: "(d)", text: "Welfare committee." },
            ],
          },
          { marker: "(3)", text: "are independently responsible for all activities of this association as prescribed in articles below." },
          { marker: "(4)", text: "The committee's shall consist of chairperson vice chairperson and members." },
        ],
      },
      {
        number: 31,
        title: "Management committee.",
        nodes: [{ marker: "(1)", text: "Shall discharge its responsibilities as directed under article 13 of this constitution." }],
      },
      {
        number: 32,
        title: "General committee function.",
        nodes: [
          { marker: "(1)", text: "Authority of this committee is vested on the committee." },
          { marker: "(2)", text: "Is responsible for formulation of rules and regulations of this association, and approval of all by-laws for committees and branches." },
          {
            marker: "(3)",
            text: "Enact, regulate laws and approve finances, budget proposals, appointments, prepare elections calendar, development projects, account withdrawals, inter organizations associations' agreement and any other activity or subject as may be referred to by this constitution.",
          },
          { marker: "(4)", text: "General supervisions of all activities of the association." },
          {
            marker: "(5)",
            text: "May reject any submissions made to it, such submission:-",
            children: [
              { marker: "(a)", text: "Is not in the interest of the association and its members." },
              { marker: "(b)", text: "Is made in disregard of the regulations or otherwise necessary." },
            ],
          },
          { marker: "(6)", text: "May remove from office the executive chairperson or any member of the executive office as referred in sections of provisions under article 14(6)." },
          { marker: "(7)", text: "May abolish any branch If in their opinion provisions of this constitution with regard to branches is violated." },
        ],
      },
      {
        number: 33,
        title: "Membership of general committee.",
        nodes: [
          {
            marker: "(1)",
            text: "General committee shall consist of-",
            children: [
              { marker: "(a)", text: "Six members directly elected on the floor on the same day as the executive is held being the fourth Sunday in November in every third." },
              { marker: "(b)", text: "Two representatives from each branch, nominated by the branch." },
              { marker: "(c)", text: "Seven members of the management committee including the executive chairperson shall become automatic members of the general committee effective after assuming office." },
              { marker: "(d)", text: "The executive chairperson shall attend the proceedings of the general committee as a member of the management committee." },
              { marker: "(e)", text: "Subject to members contemplated in clause (1,) (a) and ('b,) provisions of article-(9- (li) and (iii) shall be. considered." },
              { marker: "(f)", text: "Shall be elected among its members." },
            ],
          },
        ],
      },
      {
        number: 34,
        title: "Development committee.",
        nodes: [
          {
            marker: "(1)",
            text: "There is established the development committee which shall consist of",
            children: [
              { marker: "(a)", text: "The executive chairperson who shall chair the committee." },
              { marker: "(b)", text: "Members of the management committee" },
              { marker: "(c)", text: "Six persons from within the association membership." },
              { marker: "(d)", text: "Two persons directly nominated by the chairperson not withstanding provisions of article 29 (1) and (2 -4" },
            ],
          },
          { marker: "(2)", text: "Each branch shall present one person to the management committee who shall in accordance with provisions of article 29 (1) (c) (i) (ii) and (2) select members as required in the above clause (1) (c)" },
          { marker: "(3)", text: "Shall be responsible in all investments and any matters related to development." },
          { marker: "(4)", text: "Members of development committee are accountable collectively and individually to the general committee for the performance of their functions and exercising their powers." },
          { marker: "(5)", text: "The chairperson in consultation with the GC, may in the interest of the Association disband the development committee team, if in his opinion the members are underperforming." },
        ],
      },
      {
        number: 35,
        title: "Welfare committee.",
        nodes: [
          { marker: "(1)", text: "There is established welfare committee of this association." },
          { marker: "(2)", text: "The committee shall be chaired by the deputy chairperson." },
          { marker: "(3)", text: "The secretary general, as provided under article 17 (1) (b) (c)." },
          { marker: "(4)", text: "Organizing secretary, who shall discharge his duties in accordance with the constitution." },
          {
            marker: "(5)",
            text: "In case of death of a member, or any other person as is defined in this constitution or any other law, the branch official under which the person is a member, shall constitute membership of the welfare committee for the purpose of funeral arrangements and other related issues.",
          },
          {
            marker: "(6)",
            text: "The welfare committee shall be responsible for:",
            children: [
              { marker: "(a)", text: "Funeral arrangements." },
              { marker: "(b)", text: "Morgue" },
              { marker: "(c)", text: "Transport of body to its destination." },
              { marker: "(d)", text: "Hospital expenses" },
              { marker: "(e)", text: "Other emergencies." },
              { marker: "(f)", text: "Weddings." },
            ],
          },
          { marker: "(7)", text: "For the purpose of clause (6) (d) all members of the associations will have a valid card of the same after coming into force of this constitution register with the NHIF and" },
        ],
      },
    ],
  },
  {
    heading: "Chapter nine",
    articles: [
      {
        number: 36,
        title: "Branches",
        nodes: [
          { marker: "(1)", text: "There is established branches of this association." },
          { marker: "(2)", text: "Every branch shall have its functions and the provision of its services to members to the extent it is efficient and practicable to do so." },
          {
            marker: "(3.)",
            text: "A branch shall consist of:",
            children: [
              { marker: "(a)", text: "Elected officials who shall serve for maximum of four years of two terms each. But may stand for election for the same or other position two years after serving their full term." },
              { marker: "(b)", text: "Members of the association residing within its jurisdiction." },
            ],
          },
          { marker: "(4)", text: "It shall have a minimum of at least twenty members." },
          { marker: "(5)", text: "No branch shall come into existence within another branch unless the general committee demarcates the boundary with respect to distance and area covered." },
          {
            marker: "(6)",
            text: "A member representing members of the newly created branch not withstanding provisions of clause (4), shall apply to the management committee through the chairperson of their immediate branch indicating their intentions.",
          },
          { marker: "(7)", text: "The management committee through its executive chairperson, may reject or approve the application f in its opinion, such branch may be detrimental to the mother branch." },
          { marker: "(8)", text: "Subject to approval by the management committee, the general committee shall after submission by the management, authorize or reject the application." },
          { marker: "(9)", text: "The association shall inform in writing the register of societies the new branch coming into existence of such a branch." },
          { marker: "(10)", text: "All branches shall be guided and operate under this constitution." },
          { marker: "(11)", text: "There shall be interim officials to manage the operations of the new branch, who shall within sixty days from the time of authorization, conduct its official elections." },
          { marker: "(12)", text: "No branch is authorized to initiate, duplicate or interfere with association or cause financial stress to its members through its activities." },
          { marker: "(13)", text: "Such activity and any other shall be requested in writing to the development committee through the management committee." },
          {
            marker: "(14)",
            text: "Subject to provisions of article 5(2) (c), members shall in the event of moving to a different branch, seek transfer through their respective chairperson who shall inform the management committee in writing.",
          },
          { marker: "(15)", text: "Member referred in clause 14 shall be assumed to have automatically transferred to his new branch he/she do not notify their branch chairperson." },
          {
            marker: "(16)",
            text: "Branch chairperson shall submit a written report detailing member's participation in the association's activities to the management committee who shall hand it to the chairperson of the member's new branch.",
          },
          { marker: "(17)", text: "Branch shall not have the authority to terminate, suspend or in any way cause a member to resign from the association, such action shall be recommended to the management committee (executive)" },
          { marker: "(18)", text: "All branches shall conduct their meetings on the last Sunday of every month." },
          { marker: "(19)", text: "Shall nominate its candidates to contest in the main election." },
        ],
      },
      {
        number: 37,
        title: "By-laws",
        nodes: [
          { marker: "(1)", text: "There shall exist by-laws of this association." },
          { marker: "(2)", text: "All committee by-laws shall read as part of this constitution and can be subject to amendments at the convenience of the association." },
          {
            marker: "(3)",
            text: "Branches shall formulate their own rules as may be convenient with their activities not withstanding provisions in article 32 (2) and shall be approved by the general committee before they are effected.",
          },
          { marker: "(4)", text: "All branches shall resubmit their by-laws to the general committee for review immediately after coming into force this constitution." },
          { marker: "(5)", text: "By-laws not resubmitted shall automatically be deemed ineffective." },
        ],
      },
    ],
  },
  {
    heading: "Chapter eleven",
    articles: [
      {
        number: 38,
        title: "Elections",
        nodes: [
          {
            marker: "(1)",
            text: "The electoral system shall satisfy the following principle:",
            children: [
              { marker: "(a)", text: "The freedom of members to exercise their rights to candidacy and voting." },
              { marker: "(b)", text: "Gender equality." },
              {
                marker: "(c)",
                text: "Fair elections which are: -",
                children: [
                  { marker: "(I)", text: "by secret ballot." },
                  { marker: "(ii)", text: "Free from Violence, intimidation, improper influence or corruption." },
                  { marker: "(iii)", text: "Conducted by a nonpartisan body." },
                  { marker: "(iv)", text: "Transparent" },
                  { marker: "(v)", text: "Administered in an impartial neutral efficient accurate and a accountable manner." },
                ],
              },
            ],
          },
          { marker: "(2)", text: "Elections of executive management committee shall be held on the fourth Sunday in November in every third year." },
          { marker: "(3)", text: "Under circumstances contemplated in article 14(6) death or resignation." },
          { marker: "(4)", text: "Within sixty days shall such elections be conducted" },
          { marker: "(5)", text: "In considering other aspects of conducting elections, the general committee may confirm to the office the deputy chairperson." },
          {
            marker: "(6)",
            text: "Branches shall hold elections ninety days after the executive management committee, and conduct such elections thereafter within a period of ninety days under the directions and supervision of the management committee.",
          },
          { marker: "(7)", text: "Elections for branches will be held after every two years from the date of the last elections as referred to in clause (6) above." },
          { marker: "(8)", text: "Candidates for the executive chairperson position shall hold an open joint interview with members and give their vision for the association prior to elections." },
          { marker: "(9)", text: "Any person aspiring to be elected in any position shall first be nominated from his/her own branch." },
        ],
      },
    ],
  },
  {
    heading: "Chapter twelve.",
    articles: [
      {
        number: 39,
        title: "Amendments of the constitution.",
        nodes: [
          { marker: "(1)", text: "This constitution will be open to any amendment twelve months after its effective date." },
          {
            marker: "(2)",
            text: "A suggestion by a member to amend this constitution shall be sent to the secretary general. On receipt of such suggestion, the secretary general shall draft relevant suggested amendments and present the same to the management committee and subsequently the general committee for deliberations and amendments.",
          },
          { marker: "(3)", text: "Amendment of this constitution shall require 75% or 3/4 of total members." },
          { marker: "(4)", text: "Should amendment fail to be realized normal notice of thirty days shall be circulated all branches." },
          { marker: "(5)", text: "Letter shall be circulated fourteen days prior to the date of the second meeting. A resolution to amend shall then be passed by at least three quarters of members present." },
        ],
      },
    ],
  },
  {
    heading: "Chapter thirteen.",
    articles: [
      {
        number: 40,
        title: "Dissolution of association.",
        nodes: [
          { marker: "(1)", text: "This association shall not dissolve unless approved by members' general meeting of entire membership." },
          { marker: "(2)", text: "A resolution by at least seventy five percent 75% or three quarter of members present shall dissolve the association." },
          { marker: "(3)", text: "If under any circumstances the registrar of the societies disapproved of the dissolution then the association shall not dissolve" },
          {
            marker: "(4)",
            text: "If the registrar of societies approves the dissolution then this association stand dissolved and: -",
            children: [
              { marker: "(a)", text: "The office bearers shall dispose all assets." },
              { marker: "(b)", text: "Bearers shall settle all debts the association owes." },
            ],
          },
        ],
      },
      {
        number: 41,
        title: "General provision.",
        nodes: [
          { marker: "(1)", text: "Every member has a right to institute an appeal to the general committee claiming that this constitution has been contravened." },
          {
            marker: "(2)",
            text: "The constitution shall be interpreted in a manner that. -",
            children: [
              { marker: "(a)", text: "Promotes its purposes, values and principle." },
              { marker: "(b)", text: "Permits the development of law and its," },
              { marker: "(c)", text: "Members welfare and economic standards." },
            ],
          },
          { marker: "(3)", text: "If there is a conflict between different languages version of this Constitution, the English versions prevails." },
          { marker: "(4)", text: "This constitution shall accommodate members from the newly proposed Ugunja constituency, and give amnesty to all members under suspension, when effected." },
        ],
      },
      {
        number: 42,
        title: "Effective date.",
        nodes: [
          {
            marker: "",
            text: "This constitution shall come into force on its acceptance by the executive chairperson at an SGM and shall be announced to members, or on the expiry of a period of thirty days from the date of its receipt, whichever is earlier.",
          },
        ],
      },
      {
        number: 43,
        title: "Repeal of previous constitution.",
        nodes: [
          { marker: "", text: "Subject to the constitution in force immediately before the effective date shall stand repealed on the effective date." },
        ],
      },
      {
        number: 44,
        title: "Office bearers.",
        nodes: [
          {
            marker: "",
            text: "Persons occupying offices immediately before the effective date shall continue to serve in accordance with this constitution until the first elections held under this constitution unless a breach of this constitution thereafter.",
          },
        ],
      },
    ],
  },
];

function ClauseList({ nodes, depth }: { nodes: ConstitutionNode[]; depth: number }) {
  if (!nodes || nodes.length === 0) return null;

  return (
    <ol className={depth === 0 ? "mt-3 space-y-3" : "mt-2 space-y-2 pl-1"} style={{ listStyleType: "none" }}>
      {nodes.map((node, index) => (
        <li key={index} className="flex gap-3">
          {node.marker ? (
            <span className={depth === 0 ? "flex-none font-semibold text-[#1d3a8a]" : "flex-none font-medium text-slate-500"}>
              {node.marker}
            </span>
          ) : null}
          <div className="flex-1">
            <p className="text-base leading-7">{node.text}</p>
            {node.children ? <ClauseList nodes={node.children} depth={depth + 1} /> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

function ArticleBlock({ article }: { article: ConstitutionArticle }) {
  return (
    <div className="mt-8">
      {article.partLabel ? (
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#c9a227]">{article.partLabel}</p>
      ) : null}
      <h3 className="text-xl font-semibold text-[#0f1729] [font-family:var(--font-uae-display)]">
        {article.number} {article.title}
      </h3>
      <ClauseList nodes={article.nodes} depth={0} />
    </div>
  );
}

export default function MemberConstitutionPage() {
  return (
    <main className="bg-[#eef2ff] px-4 py-10 text-[#475569] sm:px-6 lg:px-8 lg:py-14">
      <section className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c9a227]">Ugenya Association Eldoret</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0f1729] [font-family:var(--font-uae-display)] sm:text-4xl">
          Constitution
        </h1>

        {chapters.map((chapter, chapterIndex) => (
          <section key={chapterIndex} className="mt-12 border-t border-slate-100 pt-8 first:mt-8 first:border-t-0 first:pt-0">
            <h2 className="text-2xl font-bold text-[#0f1729] [font-family:var(--font-uae-display)]">{chapter.heading}</h2>
            {chapter.articles.map((article, articleIndex) => (
              <ArticleBlock key={`${chapterIndex}-${articleIndex}`} article={article} />
            ))}
          </section>
        ))}

        <div className="mt-12 border-t border-slate-200 pt-8">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex h-28 w-28 flex-none items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Stamp
            </div>
            <div className="flex-1 space-y-6">
              <div>
                <p className="text-sm text-slate-600">Chairman Name: ______________________</p>
                <p className="mt-2 text-sm text-slate-600">Sign: ______________________</p>
                <p className="mt-2 text-sm text-slate-600">Date: ______________________</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Member 1 Name: ______________________</p>
                <p className="mt-2 text-sm text-slate-600">Sign: ______________________</p>
                <p className="mt-2 text-sm text-slate-600">Date: ______________________</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Member 2 Name: ______________________</p>
                <p className="mt-2 text-sm text-slate-600">Sign: ______________________</p>
                <p className="mt-2 text-sm text-slate-600">Date: ______________________</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-100 pt-6">
          <Link
            href="/member"
            className="inline-flex items-center justify-center rounded-lg border border-[#1d3a8a]/20 bg-white px-5 py-2.5 text-sm font-semibold text-[#0f1729] transition hover:border-[#1d3a8a]/35 hover:bg-slate-50"
          >
            Back to Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
