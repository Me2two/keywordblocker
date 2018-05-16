import { Blocker } from "@blocker/blocker";
import * as fontawesome from "@fortawesome/fontawesome";
import { faTimesCircle } from "@fortawesome/fontawesome-free-regular";
import "@styles/content_script.scss";
import { interval } from "rxjs/observable/interval";
import { debounce } from "ts-debounce";

const blocker = new Blocker();
const debounceTime = 250;
const mutationObserver = new MutationObserver(debounce(handleUpdate, debounceTime));
const ignoredChanges: string[] = ["YTD-MOVING-THUMBNAIL-RENDERER", "svg", "PAPER-TOOLTIP", "#text"];

function handleUpdate(records: MutationRecord[], _: MutationObserver) {
    const added = records
        .map((record) => [...record.addedNodes])
        .reduce((x, y) => x.concat(y))
        .filter((x: HTMLElement) => {
            return ignoredChanges.indexOf(x.nodeName) === -1 && !x.classList.contains("result-blocker");
        });
    if (added.length > 0) {
        blocker.checkForBlockedVideos();
    }
}

blocker.init().then(() => {
    const subscription =
        interval(100)
            .subscribe(() => {
                if (document.getElementById("content")) {
                    const youtubeApp = document.getElementById("content");
                    const options: MutationObserverInit = {
                        attributes: false,
                        childList: true,
                        subtree: true,
                    };
                    mutationObserver.observe(youtubeApp, options);
                    blocker.checkForBlockedVideos();
                    subscription.unsubscribe();
                }
            });
});

fontawesome.library.add(faTimesCircle);
