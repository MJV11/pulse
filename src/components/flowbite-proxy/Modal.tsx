'use client';

import {
  Modal as FlowbiteModal,
  type ModalBodyProps,
  type ModalFooterProps,
  type ModalHeaderProps,
  type ModalProps as _ModalProps,
} from 'flowbite-react';

interface ModalProps extends _ModalProps {
  show?: boolean;
}

const modalTheme = {
  root: {
    base: 'fixed inset-x-0 top-0 z-50 h-screen overflow-y-auto overflow-x-hidden md:inset-0 md:h-full',
    show: {
      on: 'flex bg-black bg-opacity-50 dark:bg-opacity-80',
      off: 'hidden',
    },
    content: {
      inner: 'relative flex max-h-[90dvh] flex-col shadow',
    },
  },
};

const modalBodyTheme = {
  base: 'flex-1 overflow-auto px-5 dark:bg-gray-900 dark:border-gray-800 border-l border-r',
};

const modalHeaderTheme = {
  base: 'flex items-start items-center justify-between rounded-t-md p-5 border-t border-l border-r dark:border-gray-800 dark:bg-gray-900',
  title: 'text-xl font-medium text-gray-900 dark:text-white w-full',
  close: {
    base: 'ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:bg-gray-900 dark:hover:bg-gray-800 dark:hover:text-white',
  },
};

const modalFooterTheme = {
  base: 'flex items-center justify-end w-full space-x-2 rounded-b-md p-5 dark:border-gray-800 dark:bg-gray-900',
  popup: 'border-b border-l border-r',
};

function Modal({ children, show = true, ...props }: ModalProps) {
  return (
    <FlowbiteModal theme={modalTheme} show={show} {...props}>
      {children}
    </FlowbiteModal>
  );
}

function Body({ children, ...props }: ModalBodyProps) {
  return (
    <FlowbiteModal.Body theme={modalBodyTheme} {...props}>
      {children}
    </FlowbiteModal.Body>
  );
}

function Header({ children, ...props }: ModalHeaderProps) {
  return (
    <FlowbiteModal.Header theme={modalHeaderTheme} {...props}>
      {children}
    </FlowbiteModal.Header>
  );
}

function Footer({ children, ...props }: ModalFooterProps) {
  return (
    <FlowbiteModal.Footer theme={modalFooterTheme} {...props}>
      {children}
    </FlowbiteModal.Footer>
  );
}

Modal.Body = Body;
Modal.Header = Header;
Modal.Footer = Footer;

export { Modal };
