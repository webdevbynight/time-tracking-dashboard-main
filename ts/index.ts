// Types
const periodUnits = {
    daily: "Day",
    weekly: "Week",
    monthly: "Month"
} as const;
type UnitsPerTimeFrame = typeof periodUnits;
type TimeFrameKey = keyof typeof periodUnits;
interface TimeFrame {
    current: number;
    previous: number;
}
interface Track {
    title: string;
    timeframes: Record<TimeFrameKey, TimeFrame>;
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

/**
 * Displays the unit to display, with its abbreviation and its meaning.
 * 
 * @param stat - The stat to use to determine whether the unit is singular or plural.
 * @returns The string containing the unit.
 */
const displayUnit = (stat: number): string => `<abbr title="${setHoursPlural(stat)}">${setHrsPlural(stat)}</abbr>`;

/**
 * Adds cards to the dashboard.
 * 
 * @param parentNode - The element who will be the cards parent.
 * @param data - The data on which the cards are based.
 */
const addCards = (parentNode: Element, data: Track[]): void => {
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
        parentNode.appendChild(card);
    }
};

/**
 * Fills cards with appropriate data according to the selected periodicity.
 * 
 * @param cards - The cards elements.
 * @param data - The data to use.
 * @param periodUnits - The units to use per periodicity.
 * @param period - The selected periodicity.
 */
const fillCards = (cards: NodeListOf<HTMLElement> | undefined, data: Track[], periodUnits: UnitsPerTimeFrame, period: TimeFrameKey): void => {
    if (cards?.length) {
        for (const card of cards) {
            const track = data.find(track => track.title === card.dataset.track);
            if (track) {
                const { current, previous } = track.timeframes[period];
                const cardCurrent = card.querySelector(".current");
                const cardLast = card.querySelector(".last");
                if (cardCurrent && cardLast) {
                    const timeUnit = periodUnits[period];
                    cardCurrent.innerHTML = `${current}${displayUnit(current)}`;
                    cardLast.innerHTML = `Last ${timeUnit} - ${previous}${displayUnit(previous)}`;
                }
            }
        }
    }
};

/**
 * Adds navigation buttons to the dashboard.
 * 
 * @param parentNode - The element who will be the navigation parent.
 * @param data - The data on which the cards are based.
 * @param periods - The periods options.
 * @param periodUnits - The units per period option.
 */
const addButtonNavigation = (parentNode: HTMLElement, data: Track[], periodUnits: UnitsPerTimeFrame): void => {
    const nav = document.createElement("nav");
    const periods = Object.keys(periodUnits) as TimeFrameKey[];
    for (const period of periods) {
        const button = document.createElement("button");
        const firstLetter = period.slice(0, 1);
        button.setAttribute("type", "button");
        button.dataset.period = period;
        button.textContent = firstLetter.toUpperCase() + period.slice(1);
        button.addEventListener("click", function () {
            const newPeriod = this.dataset.period as TimeFrameKey;
            this.classList.add("active");
            const otherButtons = this.parentNode?.querySelectorAll(`button:not([data-period="${newPeriod}"])`);
            if (otherButtons) {
                for (const button of otherButtons) {
                    button.classList.remove("active");
                }
            }
            const cards: NodeListOf<HTMLElement> | undefined = parentNode.parentNode?.querySelectorAll(".card");
            fillCards(cards, data, periodUnits, newPeriod);
        });
        nav.appendChild(button);
    }
    parentNode.appendChild(nav);

    // By default, the tracking is displayed on a daily base
    nav.firstChild?.dispatchEvent(new MouseEvent("click"));
};

// Fetch data
const response = await fetch("./data/data.json");
if (response.status === 200 && response.ok) {
    const data: Track[] = await response.json();
    if (data.length) {
        const dashboard = document.querySelector(".dashboard");
        const dashboardHeader = dashboard?.querySelector("header");
        if (dashboard && dashboardHeader) {
            addCards(dashboard, data);
            addButtonNavigation(dashboardHeader, data, periodUnits);
        }
    }
} else console.error("The data could not be found.", response.status);
