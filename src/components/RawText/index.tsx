import React, { useRef, useCallback, useState, useEffect, useLayoutEffect } from 'react';
import { getMessage } from '../../public/i18n';
import useDebounce from '../../public/react-use/useDebounce';
import { textPreprocessing } from '../../public/text-preprocessing';
import './style.css';

type RawTextProps = {
    defaultValue: string;
    rawTextTranslate: (text: string) => void;
    focusDependency: number;
    autoTranslateAfterInput: boolean;
};

const RawText: React.FC<RawTextProps> = ({ defaultValue, rawTextTranslate, focusDependency, autoTranslateAfterInput }) => {
    const [debounceDependency, setDebounceDependency] = useState(0);

    const lastTextRef = useRef('');
    const textareaEl = useRef<HTMLTextAreaElement>(null);
    const compositionStatus = useRef(false);

    const rawTextChanged = useCallback(() => {
        setDebounceDependency(v => v + 1);
    }, []);

    const handleRawTextChanged = useCallback(() => {
        if (!textareaEl.current) { return; }

        let text = textareaEl.current.value.trimLeft();

        if (!text || text.trimRight() === lastTextRef.current || !textPreprocessing(text)) { return; }

        lastTextRef.current = text.trimRight();

        rawTextTranslate(text);
    }, [rawTextTranslate]);

    useDebounce(handleRawTextChanged, 600, [debounceDependency]);

    const onCompositionStart = useCallback(() => {
        compositionStatus.current = true;
    }, []);

    const onCompositionEnd = useCallback(() => {
        compositionStatus.current = false;
        autoTranslateAfterInput && rawTextChanged();
    }, [rawTextChanged, autoTranslateAfterInput]);

    const onChange = useCallback(() => {
        autoTranslateAfterInput && !compositionStatus.current && rawTextChanged();
    }, [rawTextChanged, autoTranslateAfterInput]);

    useEffect(() => {
        if (defaultValue) {
            lastTextRef.current = defaultValue.trimRight();
            textareaEl.current && (textareaEl.current.value = defaultValue);
        }
    }, [defaultValue]);

    useEffect(() => {
        if (!textareaEl.current) { return; }

        textareaEl.current.focus();
        textareaEl.current.select();
    }, [focusDependency]);

    useLayoutEffect(() => {
        if (!textareaEl.current) { return; }

        const tempRef = textareaEl.current;

        const onRawTextKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                handleRawTextChanged();
            }
        };

        !autoTranslateAfterInput && tempRef.addEventListener('keydown', onRawTextKeyDown);

        return () => { !autoTranslateAfterInput && tempRef.removeEventListener('keydown', onRawTextKeyDown); }
    }, [handleRawTextChanged, autoTranslateAfterInput]);

    return (
        <div className='raw-text'>
            <textarea
                defaultValue={defaultValue}
                placeholder={getMessage('contentInputHere')}
                onChange={onChange}
                onCompositionStart={onCompositionStart}
                onCompositionEnd={onCompositionEnd}
                onKeyDown={e => e.stopPropagation()}
                onKeyUp={e => e.stopPropagation()}
                ref={textareaEl}
                className='raw-text__textarea'
            ></textarea>
        </div>
    );
};

export default RawText;