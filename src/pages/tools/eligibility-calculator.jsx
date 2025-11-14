import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calculator,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Phone,
  MessageCircle,
} from "lucide-react"; // Added Phone, MessageCircle
import GlassCard from "../../components/GlassCard";
import ContactCTA from "../../components/ContactCTA";
import VisaTypeSelect from "../../components/VisaTypeSelect"; // Added import
import SEOHead from "../../components/SEOHead";

export default function EligibilityCalculator() {
  const [formData, setFormData] = useState({
    age: "",
    nationality: "",
    monthly_income: "",
    total_savings: "",
    goal: "",
    marital_status: "",
    has_thai_spouse: "no",
    has_children_under_20: "no",
    willing_to_invest: "no",
    willing_to_pay_elite: "no",
  });
  const [results, setResults] = useState(null);

  const calculateEligibility = () => {
    const age = parseInt(formData.age) || 0;
    const monthly_income = parseFloat(formData.monthly_income) || 0;
    const total_savings = parseFloat(formData.total_savings) || 0;
    const thbSavings = total_savings * 35; // Assuming 1 USD = 35 THB
    const thbIncome = monthly_income * 35; // Monthly income in THB
    const annualIncomeUSD = monthly_income * 12;

    const visaOptions = [];

    // Retirement Visas (50+)
    if (age >= 50) {
      // O-A Retirement
      if (thbSavings >= 800000 || thbIncome >= 65000) {
        visaOptions.push({
          name: "Non-Immigrant O-A (Retirement Visa)",
          eligible: true,
          reason: "You meet age (50+) and financial requirements",
          requirements: [
            "Age 50+",
            "800,000 THB in bank OR 65,000 THB/month income",
            "Health insurance (40k/400k)",
            "Clean criminal record",
          ],
          color: "from-green-500 to-emerald-600",
          inCountryOption:
            "Can apply for Non-O inside Thailand first, then extend to 1-year",
          canHelp: true,
          thaiNexusHelp:
            "Thai Nexus can assist with your application, health insurance, and 1-year extensions to ensure a smooth retirement in Thailand.",
        });
      } else {
        visaOptions.push({
          name: "Non-Immigrant O-A (Retirement Visa)",
          eligible: false,
          reason: `Need ${Math.max(0, 800000 - thbSavings).toLocaleString()} more THB in savings OR ${Math.max(0, 780000 - thbIncome * 12).toLocaleString()} more THB annual income`,
          requirements: ["Age 50+", "800,000 THB OR 65,000 THB/month"],
          color: "from-red-500 to-rose-600",
          canHelp: true,
          thaiNexusHelp:
            "Thai Nexus can advise on strategies to meet financial requirements, assist with proof of funds, and manage your application process.",
        });
      }

      // O-X Long Stay
      if (thbSavings >= 3000000 || annualIncomeUSD >= 100000) {
        visaOptions.push({
          name: "Non-Immigrant O-X (Long-Stay 5-10 Year)",
          eligible: true,
          reason:
            "You meet requirements for premium 5 or 10-year retirement visa",
          requirements: [
            "Age 50+",
            "3M THB in bank OR $100k annual income",
            "Health insurance $100k+",
            "Citizens of specific countries only",
          ],
          color: "from-green-500 to-emerald-600",
          canHelp: true,
          thaiNexusHelp:
            "Thai Nexus specializes in O-X applications, ensuring all high-value asset and income proofs are correctly submitted for your 5 or 10-year stay.",
        });
      } else if (
        age >= 50 &&
        (thbSavings >= 1500000 || annualIncomeUSD >= 50000)
      ) {
        // Example close criteria
        visaOptions.push({
          name: "Non-Immigrant O-X (Long-Stay 5-10 Year)",
          eligible: false,
          reason: `You meet age but need more funds for O-X: ${(3000000 - thbSavings).toLocaleString()} THB savings OR ${(100000 - annualIncomeUSD).toLocaleString()} USD annual income`,
          requirements: [
            "Age 50+",
            "3M THB in bank OR $100k annual income",
            "Health insurance $100k+",
          ],
          color: "from-orange-500 to-red-600",
          canHelp: true,
          thaiNexusHelp:
            "Thai Nexus can help you explore options to meet the financial threshold, structure your assets, and navigate specific country requirements for the O-X visa.",
        });
      }

      // LTR Wealthy Pensioner
      if (annualIncomeUSD >= 80000) {
        visaOptions.push({
          name: "LTR Visa (Wealthy Pensioner)",
          eligible: true,
          reason: "You qualify for this premium 10-year visa",
          requirements: [
            "Age 50+",
            "$80,000+ annual income",
            "$250k+ assets",
            "Health insurance $100k+",
            "10-year validity",
          ],
          color: "from-green-500 to-emerald-600",
          canHelp: true,
          thaiNexusHelp:
            "Thai Nexus provides end-to-end support for LTR Wealthy Pensioner applications, including income verification, asset statements, and comprehensive health insurance guidance.",
        });
      } else if (annualIncomeUSD >= 40000) {
        visaOptions.push({
          name: "LTR Visa (Wealthy Pensioner)",
          eligible: false,
          reason: `Income of $${annualIncomeUSD.toLocaleString()} is below $80,000 minimum, but close`,
          requirements: ["Age 50+", "$80,000+ annual income"],
          color: "from-orange-500 to-red-600",
          canHelp: true,
          thaiNexusHelp:
            "Thai Nexus can help you assess your financial situation and identify pathways to meet the LTR Wealthy Pensioner income and asset criteria.",
        });
      }
    }

    // DTV (Digital Nomad)
    if (thbSavings >= 500000) {
      visaOptions.push({
        name: "Destination Thailand Visa (DTV)",
        eligible: true,
        reason: "You meet the 500,000 THB requirement for remote workers",
        requirements: [
          "500,000 THB in bank (last 6 months)",
          "Proof of remote work/freelance",
          "5 years validity",
          "180 days per entry (extendable to 360)",
        ],
        color: "from-green-500 to-emerald-600",
        canHelp: true,
        thaiNexusHelp:
          "Thai Nexus can assist with gathering remote work proof, bank statements, and ensuring your DTV application is perfectly documented for a 5-year stay.",
      });
    } else if (thbSavings >= 250000) {
      visaOptions.push({
        name: "Destination Thailand Visa (DTV)",
        eligible: false,
        reason: `Need ${(500000 - thbSavings).toLocaleString()} more THB (you have ${thbSavings.toLocaleString()} THB)`,
        requirements: ["500,000 THB in bank"],
        color: "from-orange-500 to-red-600",
        canHelp: true,
        thaiNexusHelp:
          "Thai Nexus can advise on how to structure your finances and provide proof of remote work to meet the DTV requirements.",
      });
    }

    // LTR Work From Thailand (High Income Remote)
    if (annualIncomeUSD >= 80000) {
      visaOptions.push({
        name: "LTR Visa (Work-From-Thailand Professional)",
        eligible: true,
        reason: "Your income qualifies for this 10-year remote work visa",
        requirements: [
          "$80,000+ annual income",
          "Remote employment proof",
          "Health insurance $100k+",
          "Digital work permit included",
        ],
        color: "from-green-500 to-emerald-600",
        canHelp: true,
        thaiNexusHelp:
          "Thai Nexus specializes in LTR Work-From-Thailand Professional applications, verifying your income, employment, and securing the integrated digital work permit.",
      });
    } else if (annualIncomeUSD >= 40000 && formData.goal === "digital_nomad") {
      visaOptions.push({
        name: "LTR Visa (Work-From-Thailand Professional)",
        eligible: false,
        reason: `Your income is $${annualIncomeUSD.toLocaleString()}, need $80,000+`,
        requirements: ["$80,000+ annual income"],
        color: "from-orange-500 to-red-600",
        canHelp: true,
        thaiNexusHelp:
          "Thai Nexus can guide you on meeting the income requirements and properly documenting your remote employment for the LTR Work-From-Thailand Professional visa.",
      });
    }

    // Business/Work Visa
    if (formData.goal === "work" || formData.has_job_offer === "yes") {
      visaOptions.push({
        name: "Non-Immigrant B (Business/Work Visa)",
        eligible: true,
        reason: "Available with company sponsorship",
        requirements: [
          "Employment contract from Thai company",
          "Company sponsors WP3 approval",
          "Company: 2M THB capital, 4 Thai employees per foreigner",
          "Your qualifications/degrees",
        ],
        color: "from-blue-500 to-cyan-600",
        inCountryOption:
          "Can convert from tourist visa inside Thailand with proper sponsorship",
        canHelp: true,
        thaiNexusHelp:
          "Thai Nexus can assist with company sponsorship, work permit applications (WP3), and navigating the complexities of business setup in Thailand.",
      });
    }

    // Dependent Visa (for spouses/children of work permit holders)
    if (
      formData.marital_status === "married" &&
      formData.goal === "dependent"
    ) {
      visaOptions.push({
        name: "Non-Immigrant O (Dependent of Work Permit Holder)",
        eligible: true,
        reason:
          "Available for spouse and children under 20 of Non-B visa holders",
        requirements: [
          "Sponsor has valid Non-B + work permit",
          "Sponsor earns 40,000+ THB/month",
          "Marriage certificate (legalized)",
          "Birth certificate for children (legalized)",
          "Visa synchronized with sponsor",
        ],
        color: "from-blue-500 to-cyan-600",
        inCountryOption:
          "Can change visa type inside Thailand (2,000 THB, 15-day processing)",
        canHelp: true,
        thaiNexusHelp:
          "Thai Nexus helps streamline the dependent visa process, ensuring all legalized documents are in order and visas are synchronized with the primary work permit holder.",
      });
    }

    // Marriage Visa
    if (formData.has_thai_spouse === "yes") {
      if (thbSavings >= 400000 || thbIncome >= 40000) {
        visaOptions.push({
          name: "Non-Immigrant O (Marriage Visa)",
          eligible: true,
          reason: "You meet requirements for marriage to Thai national",
          requirements: [
            "Legal marriage to Thai citizen",
            "400,000 THB in bank OR 40,000 THB/month income",
            "Marriage certificate (legalized)",
            "Spouse documents (ID, house registration)",
            "Possible home visit by immigration",
          ],
          color: "from-blue-500 to-cyan-600",
          inCountryOption:
            "Can apply for Non-O inside Thailand, then extend to 1-year",
          canHelp: true,
          thaiNexusHelp:
            "Thai Nexus offers comprehensive support for Marriage Visas, from financial proof to marriage certificate legalization and preparing for potential immigration home visits.",
        });
      } else {
        visaOptions.push({
          name: "Non-Immigrant O (Marriage Visa)",
          eligible: false,
          reason: `Need ${Math.max(0, 400000 - thbSavings).toLocaleString()} more THB in savings OR ${Math.max(0, 40000 - thbIncome).toLocaleString()} more THB monthly income`,
          requirements: ["400,000 THB OR 40,000 THB/month"],
          color: "from-red-500 to-rose-600",
          canHelp: true,
          thaiNexusHelp:
            "Thai Nexus can advise on meeting the financial requirements for a Marriage Visa and ensure all spousal documents are correctly prepared and submitted.",
        });
      }
    }

    // Education Visa
    // Generally available if accepted by an approved institution, minimum age might apply for some schools
    if (formData.goal === "study" || age >= 12) {
      // Assuming age 12 is a general minimum for formal ED visas
      visaOptions.push({
        name: "Non-Immigrant ED (Education Visa)",
        eligible: true,
        reason: "Available with enrollment in approved institution",
        requirements: [
          "Acceptance letter from school",
          "School registration",
          "Proof of course payment",
          "School has Ministry of Education license",
          "80%+ attendance required",
          "No work allowed",
        ],
        color: "from-blue-500 to-cyan-600",
        inCountryOption: "Can convert from tourist visa inside Thailand",
        canHelp: true,
        thaiNexusHelp:
          "Thai Nexus can connect you with approved educational institutions, assist with enrollment, visa application, and manage extensions based on attendance.",
      });
    }

    // Thai Child/Parent Support
    if (
      formData.has_children_under_20 === "yes" ||
      formData.goal === "family"
    ) {
      visaOptions.push({
        name: "Non-Immigrant O (Supporting Thai Child)",
        eligible: true,
        reason: "Available for parents of Thai children under 20",
        requirements: [
          "Birth certificate showing Thai child under 20",
          "Financial proof",
          "Child custody documents",
          "Regular home visits possible",
        ],
        color: "from-blue-500 to-cyan-600",
        canHelp: true,
        thaiNexusHelp:
          "Thai Nexus assists with all documentation for the Thai Child Support Visa, including birth certificates, custody papers, and financial proofs.",
      });
    }

    // Investment Visas
    if (formData.willing_to_invest === "yes") {
      if (total_savings * 35 >= 3000000) {
        // Approx $85,000 USD
        visaOptions.push({
          name: "Non-Immigrant IB/IM (Investment/BOI)",
          eligible: true,
          reason: "Investment visas available for BOI-approved projects",
          requirements: [
            "Minimum investment thresholds vary by sector (e.g., 3M THB)",
            "BOI promotion certificate",
            "Business plan",
            "Company registration in Thailand",
          ],
          color: "from-blue-600 to-indigo-600",
          canHelp: true,
          thaiNexusHelp:
            "Thai Nexus provides expert guidance on investment visas, connecting you with BOI-approved projects and assisting with business registration and planning.",
        });
      } else {
        visaOptions.push({
          name: "Non-Immigrant IB/IM (Investment/BOI)",
          eligible: false,
          reason: `While willing to invest, minimum investment (e.g., 3M THB) not met. Need ${(3000000 - thbSavings).toLocaleString()} THB more.`,
          requirements: ["Minimum investment (e.g., 3M THB)"],
          color: "from-red-500 to-rose-600",
          canHelp: true,
          thaiNexusHelp:
            "Thai Nexus can help you identify suitable investment opportunities and guide you on structuring your investment to meet the minimum requirements for a Thai investment visa.",
        });
      }
    }

    // SMART Visa (for high-tech)
    if (
      (annualIncomeUSD >= 80000 && formData.goal === "work") ||
      (formData.willing_to_invest === "yes" && total_savings * 35 >= 500000)
    ) {
      visaOptions.push({
        name: "SMART Visa",
        eligible: true,
        reason:
          "For high-skilled professionals, investors, executives, or startups in S-Curve industries",
        requirements: [
          "Work in 13 targeted industries",
          "Bachelor's degree + 5 years experience",
          "100,000 THB+ salary (or specific investor/executive criteria)",
          "4-year validity",
          "Digital work permit included",
        ],
        color: "from-purple-500 to-indigo-600",
        canHelp: true,
        thaiNexusHelp:
          "Thai Nexus specializes in SMART Visa applications, assisting with industry classification, proving skills/experience, and navigating the digital work permit process.",
      });
    }

    // Thailand Elite
    if (formData.willing_to_pay_elite === "yes") {
      visaOptions.push({
        name: "Thailand Privilege (Elite) Visa",
        eligible: true,
        reason: "Pay-to-stay option bypasses all other requirements",
        requirements: [
          "Payment: 900,000 - 2,000,000 THB depending on package",
          "5-20 year options",
          "VIP services included",
          "No financial/work requirements",
          "No 90-day reporting",
        ],
        color: "from-blue-600 to-indigo-600",
        canHelp: true,
        thaiNexusHelp:
          "Thai Nexus simplifies your Thailand Elite application, helping you choose the right package and handling all paperwork for a hassle-free premium visa.",
      });
    }

    // Tourist Visa (always available)
    visaOptions.push({
      name: "Tourist Visa (60 days)",
      eligible: true,
      reason: "Available to almost all nationalities for short-term stays",
      requirements: [
        "Valid passport (6+ months)",
        "Proof of funds (20,000 THB)",
        "Onward travel",
        "Single-entry or multiple-entry available",
      ],
      color: "from-cyan-500 to-blue-500",
      inCountryOption: "Can extend once for 30 days at immigration (1,900 THB)",
      canHelp: true,
      thaiNexusHelp:
        "Thai Nexus can assist with extending your Tourist Visa, advising on necessary documentation, and exploring options for converting to a long-term visa type.",
    });

    // Visa Exemption (mention)
    visaOptions.push({
      name: "Visa Exemption Scheme (VE)",
      eligible: true,
      reason: "Most nationalities get 30-60 days visa-free on arrival",
      requirements: [
        "No application needed",
        "Granted at airport",
        "Duration varies by nationality (30/45/60/90 days)",
        "Extendable 30 days",
      ],
      color: "from-green-500 to-teal-500",
      inCountryOption:
        "Extend 30 days at immigration or change to Non-O visa type",
      canHelp: true,
      thaiNexusHelp:
        "Thai Nexus can advise on maximizing your stay under Visa Exemption, including extensions and pathways to transition to a long-term visa.",
    });

    // Sort: eligible first, then by complexity/value (higher value visas first)
    visaOptions.sort((a, b) => (b.eligible ? 1 : 0) - (a.eligible ? 1 : 0));

    setResults(visaOptions);
  };

  return (
    <>
      <SEOHead page="EligibilityCalculator" />
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#272262] via-[#3d3680] to-[#272262] p-10 text-center">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)",
              backgroundSize: "50px 50px",
            }}
          />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-4">
              <Calculator className="w-5 h-5 text-white" />
              <span className="text-white text-sm font-bold">
                Instant Eligibility Check
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
              Thailand Visa Eligibility Calculator
            </h1>
            <p className="text-white/90 text-lg">
              Find out which Thai visas you qualify for in seconds
            </p>
          </div>
        </div>

        <GlassCard className="p-8">
          <h2 className="text-3xl font-bold text-[#272262] mb-6">
            Your Information
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Age */}
            <div>
              <Label className="text-[#272262] mb-3 block font-semibold text-lg">
                Age
              </Label>
              <Input
                type="number"
                value={formData.age}
                onChange={(e) =>
                  setFormData({ ...formData, age: e.target.value })
                }
                placeholder="e.g., 35"
                className="h-14 text-lg border border-gray-300 rounded-md placeholder:text-gray-400 text-gray-700 focus-visible:ring-0 focus:border-gray-300"
              />
            </div>

            {/* Nationality */}
            <div>
              <Label className="text-[#272262] mb-3 block font-semibold text-lg">
                Nationality
              </Label>
              <Input
                value={formData.nationality}
                onChange={(e) =>
                  setFormData({ ...formData, nationality: e.target.value })
                }
                placeholder="e.g., American"
                className="h-14 text-lg border border-gray-300 rounded-md placeholder:text-gray-400 text-gray-700 focus-visible:ring-0 focus:border-gray-300"
              />
            </div>

            {/* Monthly Income */}
            <div>
              <Label className="text-[#272262] mb-3 block font-semibold text-lg">
                Monthly Income (USD)
              </Label>
              <Input
                type="number"
                value={formData.monthly_income}
                onChange={(e) =>
                  setFormData({ ...formData, monthly_income: e.target.value })
                }
                placeholder="e.g., 3000"
                className="h-14 text-lg border border-gray-300 rounded-md placeholder:text-gray-400 text-gray-700 focus-visible:ring-0 focus:border-gray-300"
              />
            </div>

            {/* Total Savings */}
            <div>
              <Label className="text-[#272262] mb-3 block font-semibold text-lg">
                Total Savings (USD)
              </Label>
              <Input
                type="number"
                value={formData.total_savings}
                onChange={(e) =>
                  setFormData({ ...formData, total_savings: e.target.value })
                }
                placeholder="e.g., 25000"
                className="h-14 text-lg border border-gray-300 rounded-md placeholder:text-gray-400 text-gray-700 focus-visible:ring-0 focus:border-gray-300"
              />
            </div>

            {/* Visa Type Goal */}
            <div>
              <Label className="text-[#272262] mb-3 block font-semibold text-lg">
                Primary Visa Type Goal
              </Label>
              <VisaTypeSelect
                value={formData.goal}
                onValueChange={(val) => setFormData({ ...formData, goal: val })}
                placeholder="Select visa type"
                className="h-14 text-lg border border-gray-300 rounded-md placeholder:text-gray-400 text-gray-700 focus-visible:ring-0 focus:border-gray-300"
                excludePermitsReports={true}
              />
            </div>

            {/* Marital Status */}
            <div>
              <Label className="text-[#272262] mb-3 block font-semibold text-lg">
                Marital Status
              </Label>
              <Select
                value={formData.marital_status}
                onValueChange={(val) =>
                  setFormData({ ...formData, marital_status: val })
                }
              >
                <SelectTrigger className="h-14 text-lg border border-gray-300 rounded-md placeholder:text-gray-400 text-gray-700 focus-visible:ring-0 focus:border-gray-300">
                  <SelectValue
                    placeholder="Select status"
                    className="text-gray-400"
                  />
                </SelectTrigger>
                <SelectContent
                  className="bg-white shadow-lg rounded-md border border-gray-200"
                  position="popper"
                >
                  <SelectItem value="single" className="text-gray-700">
                    Single
                  </SelectItem>
                  <SelectItem value="married" className="text-gray-700">
                    Married
                  </SelectItem>
                  <SelectItem value="divorced" className="text-gray-700">
                    Divorced
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Married to Thai National */}
            <div>
              <Label className="text-[#272262] mb-3 block font-semibold text-lg">
                Married to Thai National?
              </Label>
              <Select
                value={formData.has_thai_spouse}
                onValueChange={(val) =>
                  setFormData({ ...formData, has_thai_spouse: val })
                }
              >
                <SelectTrigger className="h-14 text-lg border border-gray-300 rounded-md placeholder:text-gray-400 text-gray-700 focus-visible:ring-0 focus:border-gray-300">
                  <SelectValue
                    placeholder="Select option"
                    className="text-gray-400"
                  />
                </SelectTrigger>
                <SelectContent
                  className="bg-white shadow-lg rounded-md border border-gray-200"
                  position="popper"
                >
                  <SelectItem value="yes" className="text-gray-700">
                    Yes
                  </SelectItem>
                  <SelectItem value="no" className="text-gray-700">
                    No
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Thai Children Under 20 */}
            <div>
              <Label className="text-[#272262] mb-3 block font-semibold text-lg">
                Thai Children Under 20?
              </Label>
              <Select
                value={formData.has_children_under_20}
                onValueChange={(val) =>
                  setFormData({ ...formData, has_children_under_20: val })
                }
              >
                <SelectTrigger className="h-14 text-lg border border-gray-300 rounded-md placeholder:text-gray-400 text-gray-700 focus-visible:ring-0 focus:border-gray-300">
                  <SelectValue
                    placeholder="Select option"
                    className="text-gray-400"
                  />
                </SelectTrigger>
                <SelectContent
                  className="bg-white shadow-lg rounded-md border border-gray-200"
                  position="popper"
                >
                  <SelectItem value="yes" className="text-gray-700">
                    Yes
                  </SelectItem>
                  <SelectItem value="no" className="text-gray-700">
                    No
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Job Offer */}
            <div>
              <Label className="text-[#272262] mb-3 block font-semibold text-lg">
                Job Offer from Thai Company?
              </Label>
              <Select
                value={formData.has_job_offer}
                onValueChange={(val) =>
                  setFormData({ ...formData, has_job_offer: val })
                }
              >
                <SelectTrigger className="h-14 text-lg border border-gray-300 rounded-md placeholder:text-gray-400 text-gray-700 focus-visible:ring-0 focus:border-gray-300">
                  <SelectValue
                    placeholder="Select option"
                    className="text-gray-400"
                  />
                </SelectTrigger>
                <SelectContent
                  className="bg-white shadow-lg rounded-md border border-gray-200"
                  position="popper"
                >
                  <SelectItem value="yes" className="text-gray-700">
                    Yes
                  </SelectItem>
                  <SelectItem value="no" className="text-gray-700">
                    No
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Willing to Invest */}
            <div>
              <Label className="text-[#272262] mb-3 block font-semibold text-lg">
                Willing to Invest?
              </Label>
              <Select
                value={formData.willing_to_invest}
                onValueChange={(val) =>
                  setFormData({ ...formData, willing_to_invest: val })
                }
              >
                <SelectTrigger className="h-14 text-lg border border-gray-300 rounded-md placeholder:text-gray-400 text-gray-700 focus-visible:ring-0 focus:border-gray-300">
                  <SelectValue
                    placeholder="Select option"
                    className="text-gray-400"
                  />
                </SelectTrigger>
                <SelectContent
                  className="bg-white shadow-lg rounded-md border border-gray-200"
                  position="popper"
                >
                  <SelectItem value="yes" className="text-gray-700">
                    Yes ($85k+ USD or 3M+ THB)
                  </SelectItem>
                  <SelectItem value="no" className="text-gray-700">
                    No
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Willing to Pay Elite Fee */}
            <div>
              <Label className="text-[#272262] mb-3 block font-semibold text-lg">
                Willing to Pay Elite Fee?
              </Label>
              <Select
                value={formData.willing_to_pay_elite}
                onValueChange={(val) =>
                  setFormData({ ...formData, willing_to_pay_elite: val })
                }
              >
                <SelectTrigger className="h-14 text-lg border border-gray-300 rounded-md placeholder:text-gray-400 text-gray-700 focus-visible:ring-0 focus:border-gray-300">
                  <SelectValue
                    placeholder="Select option"
                    className="text-gray-400"
                  />
                </SelectTrigger>
                <SelectContent
                  className="bg-white shadow-lg rounded-md border border-gray-200"
                  position="popper"
                >
                  <SelectItem value="yes" className="text-gray-700">
                    Yes (900k–2M THB)
                  </SelectItem>
                  <SelectItem value="no" className="text-gray-700">
                    No
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={calculateEligibility}
            className="w-full mt-8 bg-[#BF1E2E] hover:bg-[#9d1825] text-white py-7 text-lg font-bold shadow-lg"
          >
            <Calculator className="w-5 h-5 mr-2" />
            Calculate My Eligibility
          </Button>
        </GlassCard>

        {results && (
          <div className="space-y-6">
            <GlassCard
              className="p-6 text-center bg-linear-to-br from-green-50 to-emerald-50 border border-green-300"
              hover={false}
            >
              <h2 className="text-3xl font-bold text-[#272262] mb-2">
                Your Complete Visa Options
              </h2>
              <p className="text-[#454545] text-lg">
                All visa types for your situation - including options where Thai
                Nexus can help you qualify
              </p>
            </GlassCard>

            {results.map((visa, index) => (
              <GlassCard key={index} className="p-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`shrink-0 w-14 h-14 rounded-2xl bg-linear-to-br ${visa.color} flex items-center justify-center shadow-lg`}
                  >
                    {visa.eligible ? (
                      <CheckCircle2 className="w-7 h-7 text-white" />
                    ) : (
                      <XCircle className="w-7 h-7 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="text-2xl font-bold text-[#272262]">
                        {visa.name}
                      </h3>
                      {visa.eligible ? (
                        <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-bold border border-green-300">
                          ✓ Eligible
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-bold border border-red-300">
                          Not Eligible
                        </span>
                      )}
                      {visa.canHelp && (
                        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-bold border border-blue-300">
                          🤝 We Can Help
                        </span>
                      )}
                    </div>
                    <p className="text-[#454545] mb-4 leading-relaxed">
                      {visa.reason}
                    </p>

                    {visa.inCountryOption && (
                      <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <p className="text-blue-800 font-medium">
                          <strong>In-Country Option:</strong>{" "}
                          {visa.inCountryOption}
                        </p>
                      </div>
                    )}

                    {visa.thaiNexusHelp && (
                      <div
                        className={`mb-4 p-4 rounded-xl border-2 ${visa.canHelp ? "bg-[#BF1E2E]/5 border-[#BF1E2E]" : "bg-[#272262]/5 border-[#272262]"}`}
                      >
                        <p
                          className={`font-bold text-sm mb-2 ${visa.canHelp ? "text-[#BF1E2E]" : "text-[#272262]"}`}
                        >
                          Thai Nexus Support:
                        </p>
                        <p className="text-[#454545] text-sm leading-relaxed">
                          {visa.thaiNexusHelp}
                        </p>
                      </div>
                    )}

                    <div className="bg-[#F8F9FA] p-5 rounded-xl border border-[#E7E7E7]">
                      <div className="flex items-start gap-2 mb-3">
                        <AlertCircle className="w-5 h-5 text-[#272262] mt-0.5" />
                        <span className="text-[#272262] font-bold text-lg">
                          Requirements:
                        </span>
                      </div>
                      <ul className="space-y-2 ml-7">
                        {visa.requirements.map((req, i) => (
                          <li
                            key={i}
                            className="text-[#454545] leading-relaxed"
                          >
                            • {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}

            {/* Enhanced CTA for complex cases */}
            <GlassCard className="p-8 bg-linear-to-br from-[#272262] to-[#3d3680] border-none text-white shadow-xl">
              <div className="text-center mb-6">
                <h3 className="text-2xl md:text-3xl font-bold mb-3">
                  Complex Case? Do not Give Up.
                </h3>
                <p className="text-white/95 text-lg leading-relaxed mb-2">
                  Many applicants get rejected due to paperwork errors,
                  incomplete documentation, or not knowing alternative paths.
                </p>
                <p className="text-white font-bold text-xl">
                  Thai Nexus has helped 500+ clients succeed where DIY failed.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-6 text-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold mb-2">95%</div>
                  <div className="text-sm text-white/90">Success Rate</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold mb-2">15+</div>
                  <div className="text-sm text-white/90">Years Experience</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold mb-2">24h</div>
                  <div className="text-sm text-white/90">Response Time</div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-6">
                <h4 className="font-bold text-lg mb-3">We specialize in:</h4>
                <ul className="grid md:grid-cols-2 gap-2 text-sm text-white/95">
                  <li>✓ Borderline financial cases</li>
                  <li>✓ Previous visa denials</li>
                  <li>✓ Overstay history resolution</li>
                  <li>✓ Complex family situations</li>
                  <li>✓ Business/investment structuring</li>
                  <li>✓ Last-minute urgent cases</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  className="flex-1 bg-white hover:bg-gray-50 text-[#272262] font-semibold h-14 shadow-lg text-lg"
                  onClick={() =>
                    window.open("https://wa.me/66923277723", "_blank")
                  }
                >
                  <Phone className="w-5 h-5 mr-2" />
                  WhatsApp: +66923277723
                </Button>

                <Button
                  className="flex-1 bg-[#BF1E2E] hover:bg-[#9d1825] text-white font-semibold h-14 shadow-lg text-lg"
                  onClick={() =>
                    window.open("https://line.me/ti/p/@thainexus", "_blank")
                  }
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Line: @thainexus
                </Button>
              </div>

              <p className="text-center text-sm text-white/80 mt-4">
                Free consultation • No obligation • Confidential
              </p>
            </GlassCard>
          </div>
        )}
      </div>
    </>
  );
}
