// Types
type TimeFramesKeys = "daily" | "weekly" | "monthly";
interface TimeFrame {
    current: number;
    previous: number;
}
interface Track {
    title: string;
    timeframes: Record<TimeFramesKeys, TimeFrame>;
}

/**
 * Checks if singular or plural has to be used.
 *
 * @param stat - The stat to use to determine singular or plural.
 * @return True if it is singular, false otherwise.
 */
const isSingular = (stat: number): boolean => {
    const pluralRules = new Intl.PluralRules("en-GB");
    return pluralRules.select(stat) === "one";
};

/**
 * Sets the `hour` word in singular or plural.
 *
 * @param stat - The stat to use to determine singular or plural.
 * @return The word `hour` or `hours`.
 */
const setHoursPlural = (stat: number): string => (isSingular(stat) ? "hour" : "hours");

/**
 * Sets the `hr` abbreviation in singular or plural.
 *
 * @param stat - The stat to use to determine singular or plural.
 * @return The abbreviation `hr` or `hrs`.
 */
const setHrsPlural = (stat: number): string => (isSingular(stat) ? "hr" : "hrs");

// Fetch data
const response = await fetch("./data/data.json");
if (response.status === 200 && response.ok) {
    const data: Track[] = await response.json();
    if (data.length) {
        const dashboard = document.querySelector(".dashboard");
        const dashboardHeader = dashboard?.querySelector("header");
        if (dashboard && dashboardHeader) {
            for (const track of data) {
                const card = document.createElement("section");
                const { title } = track;
                const kebabCaseTitle = title.toLowerCase().replaceAll(/\s/g, "-");
                card.classList.add("card", kebabCaseTitle);
                card.dataset.track = title;
                card.setAttribute("aria-live", "polite");
                const heading = document.createElement("h2");
                heading.className = "title";
                heading.textContent = title;
                card.appendChild(heading);
                const buttonContainer = document.createElement("p");
                const button = document.createElement("button");
                const buttonLabel = "Act or not with this button";
                button.title = buttonLabel;
                button.setAttribute("type", "button");
                const buttonSpan = document.createElement("span");
                buttonSpan.className = "sr-only";
                buttonSpan.textContent = buttonLabel;
                button.appendChild(buttonSpan);
                buttonContainer.appendChild(button);
                const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                const svgWidth = 21;
                const svgHeight = 5;
                svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
                svg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
                svg.setAttribute("version", "1.1");
                svg.setAttribute("width", String(svgWidth));
                svg.setAttribute("height", String(svgHeight));
                svg.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);
                const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
                svg.appendChild(defs);
                const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                circle.id = `circle-${kebabCaseTitle}`;
                circle.setAttribute("r", "2.5");
                circle.setAttribute("cx", "2.5");
                circle.setAttribute("cy", "2.5");
                defs.appendChild(circle);
                for (let i = 1; i <= 3; i++) {
                    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
                    use.setAttributeNS("http://www.w3.org/1999/xlink", "href", `#circle-${kebabCaseTitle}`);
                    svg.appendChild(use);
                }
                button.appendChild(svg);
                card.appendChild(buttonContainer);
                const current = document.createElement("p");
                current.className = "current";
                card.appendChild(current);
                const last = document.createElement("p");
                last.className = "last";
                card.appendChild(last);
                dashboard.appendChild(card);
            }
            const nav = document.createElement("nav");
            const periods: TimeFramesKeys[] = ["daily", "weekly", "monthly"];
            const periodUnits: Record<TimeFramesKeys, string> = {
                daily: "Day",
                weekly: "Week",
                monthly: "Month"
            };
            for (const period of periods) {
                const button = document.createElement("button");
                const firstLetter = period.slice(0, 1);
                button.setAttribute("type", "button");
                button.dataset.period = period;
                button.textContent = firstLetter.toUpperCase() + period.slice(1);
                button.addEventListener("click", function () {
                    const newPeriod = this.dataset.period as TimeFramesKeys;
                    this.classList.add("active");
                    const otherButtons = this.parentNode?.querySelectorAll(`button:not([data-period="${newPeriod}"])`);
                    if (otherButtons) {
                        for (const button of otherButtons) {
                            button.classList.remove("active");
                        }
                    }
                    const cards: NodeListOf<HTMLElement> = dashboard.querySelectorAll(".card");
                    for (const card of cards) {
                        const track = data.find(track => track.title === card.dataset.track);
                        if (track) {
                            const { current, previous } = track.timeframes[newPeriod];
                            const cardCurrent = card.querySelector(".current");
                            const cardLast = card.querySelector(".last");
                            if (cardCurrent && cardLast) {
                                const timeUnit = periodUnits[period];
                                cardCurrent.innerHTML = `${current}<abbr title="${setHoursPlural(current)}">${setHrsPlural(current)}</abbr>`;
                                cardLast.innerHTML = `Last ${timeUnit} - ${previous}<abbr title="${setHoursPlural(previous)}">${setHrsPlural(previous)}</abbr>`;
                            }
                        }
                    }
                });
                nav.appendChild(button);
            }
            dashboardHeader.appendChild(nav);

            // By default, the tracking is displayed on a daily base
            nav.firstChild?.dispatchEvent(new MouseEvent("click"));
        }
    }
} else console.error("The data could not be found.", response.status);
