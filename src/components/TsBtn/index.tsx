import React, {useState, useEffect, useCallback, useRef} from 'react';
import { getSelectedText } from '../../public/utils/get-selection';
import { useOptions, useOnExtensionMessage, useIsEnable, useGetSelection, useAppSelector, useAppDispatch } from '../../public/react-use';
import {
    SCTS_CONTEXT_MENUS_CLICKED,
    SCTS_TRANSLATE_COMMAND_KEY_PRESSED,
    SCTS_AUDIO_COMMAND_KEY_PRESSED,
    SCTS_CALL_OUT_COMMAND_KEY_PRESSED,
    SCTS_CLOSE_COMMAND_KEY_PRESSED
} from '../../constants/chromeSendMessageTypes';
import IconFont from '../IconFont';
import './style.css';
import { sendAudio, sendSeparate } from '../../public/send';
import { getOptions } from '../../public/options';
import { debounce, isTextBox } from '../../public/utils';
import { DefaultOptions, Position } from '../../types';
import { callOutPanel, closePanel, requestToHidePanel, showPanelAndSetPosition } from '../../redux/slice/panelStatusSlice';
import { mtSetText, mtSetTo } from '../../redux/slice/multipleTranslateSlice';
import { stSetText, stSetTo } from '../../redux/slice/singleTranslateSlice';
import {
    translateButtonContext,
    TRANSLATE_BUTTON_COPY,
    TRANSLATE_BUTTON_LISTEN,
    TRANSLATE_BUTTON_TL_FIRST,
    TRANSLATE_BUTTON_TL_SECOND,
    TRANSLATE_BUTTON_TL_THIRD,
    TRANSLATE_BUTTON_TRANSLATE
} from '../../constants/translateButtonTypes';

const initText = '';
const initPos = { x: 5, y: 5 };

type PickedOptions = Pick<
    DefaultOptions,
    'translateDirectly' |
    'translateWithKeyPress' |
    'hideButtonAfterFixedTime' |
    'hideButtonFixedTime' |
    'respondToSeparateWindow' |
    'translateDirectlyWhilePinning' |
    'doNotRespondInTextBox' |
    'translateButtons' |
    'translateButtonsTL'
>;
const useOptionsDependency: (keyof PickedOptions)[] = [
    'translateDirectly',
    'translateWithKeyPress',
    'hideButtonAfterFixedTime',
    'hideButtonFixedTime',
    'respondToSeparateWindow',
    'translateDirectlyWhilePinning',
    'doNotRespondInTextBox',
    'translateButtons',
    'translateButtonsTL'
];

const calculateBtnPos = ({ x, y }: Position, translateButtonElement: HTMLDivElement | null) => {
    const { btnPosition } = getOptions();
    const rect = translateButtonElement?.getBoundingClientRect();
    const btnHeight = rect?.height ?? 22;
    const btnWidth = rect?.width ?? 22;
    let tmpX = x + btnPosition.x, tmpY = y + btnPosition.y;

    const dH = document.documentElement.clientHeight;
    const dW = document.documentElement.clientWidth;
    const bL = tmpX;
    const bT = tmpY;
    const bB = bT + btnHeight;
    const bR = bL + btnWidth;

    if (bB > dH) tmpY = y - 5 - btnHeight;
    if (bT < 0) tmpY = y + 5;
    if (bR > dW) tmpX = x - 5 - btnWidth;
    if (bL < 0) tmpX = x + 5;

    if (tmpX + btnWidth + 5 > dW) tmpX = dW - btnWidth - 5;
    if (tmpX < 5) tmpX = 5;
    if (tmpY + btnHeight + 5 > dH) tmpY = dH - btnHeight - 5;
    if (tmpY < 5) tmpY = 5;

    return { x: tmpX, y: tmpY };
};

const TsBtn: React.FC = () => {
    const [showBtn, setShowBtn] = useState(false);
    const [pos, setPos] = useState(initPos);
    const [text, setText] = useState(initText);

    const ctrlPressing = useRef(false);
    const debounceHideButtonAfterFixedTime = useRef<ReturnType<typeof debounce>>();
    const oldChromeMsg = useRef<any>(null);
    const translateButtonEleRef = useRef<HTMLDivElement>(null);

    const { pinning } = useAppSelector(state => state.panelStatus);

    const {
        translateDirectly,
        translateWithKeyPress,
        hideButtonAfterFixedTime,
        hideButtonFixedTime,
        respondToSeparateWindow,
        translateDirectlyWhilePinning,
        doNotRespondInTextBox,
        translateButtons,
        translateButtonsTL
    } = useOptions<PickedOptions>(useOptionsDependency);

    const isEnableTranslate = useIsEnable('translate', window.location.host);

    const chromeMsg = useOnExtensionMessage();

    const dispatch = useAppDispatch();

    const handleForwardTranslate = useCallback((text: string, position: Position, to: undefined | string = undefined) => {
        if (respondToSeparateWindow) {
            sendSeparate(text);
            return;
        }

        dispatch(showPanelAndSetPosition({ position }));

        to !== undefined && (getOptions().multipleTranslateMode ? dispatch(mtSetTo({ to })) : dispatch(stSetTo({ to })));

        getOptions().multipleTranslateMode ? dispatch(mtSetText({ text })) : dispatch(stSetText({ text }));
    }, [dispatch, respondToSeparateWindow]);

    const handleTranslateButtonClick = (translateButton: string) => {
        setShowBtn(false);

        switch (translateButton) {
            case TRANSLATE_BUTTON_TRANSLATE:
                handleForwardTranslate(text, pos);
                break;
            case TRANSLATE_BUTTON_LISTEN:
                sendAudio(text, {});
                break;
            case TRANSLATE_BUTTON_COPY:
                navigator.clipboard.writeText(text);
                break;
            case TRANSLATE_BUTTON_TL_FIRST:
                handleForwardTranslate(text, pos, translateButtonsTL.first);
                break;
            case TRANSLATE_BUTTON_TL_SECOND:
                handleForwardTranslate(text, pos, translateButtonsTL.second);
                break;
            case TRANSLATE_BUTTON_TL_THIRD:
                handleForwardTranslate(text, pos, translateButtonsTL.third);
                break;
            default: break;
        }
    };

    useEffect(() => {
        if (!translateWithKeyPress) return;

        const onKeyDown = (e: KeyboardEvent) => {
            e.key === 'Control' && !ctrlPressing.current && (ctrlPressing.current = true);
        };
        const onKeyUp = (e: KeyboardEvent) => {
            e.key === 'Control' && ctrlPressing.current && (ctrlPressing.current = false);
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        }
    }, [translateWithKeyPress]);

    useEffect(() => {
        if (oldChromeMsg.current === chromeMsg || !isEnableTranslate) { return; }

        const { type, payload } = chromeMsg;
        let text;

        switch (type) {
            case SCTS_CONTEXT_MENUS_CLICKED:
                setShowBtn(false);
                handleForwardTranslate(payload.selectionText, pos);
                break;
            case SCTS_TRANSLATE_COMMAND_KEY_PRESSED:
                setShowBtn(false);
                text = getSelectedText();
                text && handleForwardTranslate(text, pos);
                break;
            case SCTS_AUDIO_COMMAND_KEY_PRESSED:
                text = getSelectedText();
                text && sendAudio(text, {});
                break;
            case SCTS_CALL_OUT_COMMAND_KEY_PRESSED:
                dispatch(callOutPanel());
                break;
            case SCTS_CLOSE_COMMAND_KEY_PRESSED:
                dispatch(closePanel());
                break;
            default: break;
        }

        oldChromeMsg.current = chromeMsg;
    }, [chromeMsg, isEnableTranslate, handleForwardTranslate, dispatch, pos]);

    useGetSelection(({ text, pos }) => {
        if (!isEnableTranslate) { return; }

        if (doNotRespondInTextBox && document.activeElement && isTextBox(document.activeElement)) { return; }

        if ((translateWithKeyPress && ctrlPressing.current) || translateDirectly || (pinning && translateDirectlyWhilePinning)) {
            handleForwardTranslate(text, calculateBtnPos(pos, null));
            return;
        }

        setText(text);
        if (translateButtons.length > 0) {
            setShowBtn(true);
            setPos(calculateBtnPos(pos, translateButtonEleRef.current));
            hideButtonAfterFixedTime && debounceHideButtonAfterFixedTime.current?.();
        }
        else {
            setPos(calculateBtnPos(pos, null));
        }

        dispatch(requestToHidePanel());
    }, () => {
        setShowBtn(false);

        dispatch(requestToHidePanel());
    });

    useEffect(() => {
        debounceHideButtonAfterFixedTime.current = debounce(() => setShowBtn(false), hideButtonFixedTime);
    }, [hideButtonFixedTime]);

    return (
        <div
            ref={translateButtonEleRef}
            className='translate-button'
            style={{
                display: isEnableTranslate && showBtn && translateButtons.length > 0 ? 'flex' : 'none',
                left: `${pos.x}px`,
                top: `${pos.y}px`
            }}
            onMouseUp={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
        >
            {translateButtons.map((translateButton) => (translateButtonContext[translateButton].type === 'icon' && <div
                className='translate-button__item iconfont--enable'
                onClick={() => handleTranslateButtonClick(translateButton)}
            >
                <IconFont iconName={translateButtonContext[translateButton].iconName} />
            </div>))}
        </div>
    );
};

export default TsBtn;