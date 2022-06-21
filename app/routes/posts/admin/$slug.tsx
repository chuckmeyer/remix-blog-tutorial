import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useTransition, } from "@remix-run/react";
import { useLoaderData } from "@remix-run/react";

import invariant from "tiny-invariant";

import type { Post } from "~/models/post.server";
import { deletePost, getPost, updatePost } from "~/models/post.server";

type LoaderData = { post: Post };

export const loader: LoaderFunction = async ({ params }) => {
  invariant(params.slug, `params.slug is required`);

  const post = await getPost(params.slug);
  invariant(post, `Post not found: ${params.slug}`);

  return json<LoaderData>({ post });
};

type ActionData = 
  | {
      title: null | string;
      slug: null | string;
      markdown: null | string;
    }
  | undefined;

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const _action = formData.get("_action");
  if (_action === "create" ) {
    const title = formData.get("title");
    const slug = formData.get("slug");
    const markdown = formData.get("markdown");

    const errors: ActionData = {
      title: title ? null : "Title is required",
      slug: slug ? null : "Slug is required",
      markdown: markdown ? null : "Markdown is required",
    };
    const hasErrors = Object.values(errors).some(
      (errorMessage) => errorMessage
    );
    if (hasErrors) {
      return json<ActionData>(errors);
    }

    invariant(
      typeof title === "string",
      "title must be a string"
    );
    invariant(
      typeof slug === "string",
      "slug must be a string"
    );
    invariant(
      typeof markdown === "string",
      "markdown must be a string"
    );

    await updatePost(slug, { title, slug, markdown });

    return redirect("/posts/admin");
  }
  if (_action === "delete" ) {
    const slug = formData.get("slug");
    await deletePost(slug);

    return redirect("/posts/admin");
  }

};

const inputClassName = `w-full rounded border border-gray-500 px-2 py-1 text-lg`;

export default function EditPost() {
  const { post } = useLoaderData<LoaderData>();
  const errors = useActionData();

  const transition = useTransition();
  const isUpdating = Boolean(transition.submission);

  return (
  <main>
    <div class="flex justify-end">
      <Form
        style={{
          display: "inline",
        }}
        method="post"
      >
        <input
          type="hidden"
          name="slug"
          value={post.slug}
        />
        <button
          type="submit" 
          name="_action"
          value="delete"
          className="rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400 disabled:bg-blue-300"
          aria-label="delete"
        >
          ❌
        </button>
      </Form>
    </div>
    <Form key={post.slug} method="post">
      <p>
        <label>
          Post Title:{" "}
          {errors?.title ? (
            <em className="text-red-600">{errors.title}</em>
          ) : null}
          <input
            type="text"
            name="title"
            defaultValue={post.title}
            className={inputClassName}
          />
        </label>
      </p>
      <p>
        <label>
          Post Slug:{" "}
          {errors?.slug? (
            <em className="text-red-600">{errors.slug}</em>
          ) : null}
          <input
            type="text"
            name="slug"
            value={post.slug}
            readOnly
            className={inputClassName}
          />
        </label>
      </p>
      <p>
        <label htmlFor="markdown">
          Markdown:{" "}
          {errors?.markdown? (
            <em className="text-red-600">{errors.markdown}</em>
          ) : null}
        </label>
        <br />
        <textarea
          id="markdown"
          rows={20}
          name="markdown"
          defaultValue={post.markdown}
          className={`${inputClassName} font-mono`}
        />
      </p>
      <p className="text-right">
        <button
          type="submit"
          name="_action"
          value="create"
          className="rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400 disabled:bg-blue-300"
          disabled={isUpdating}
        >
          {isUpdating? "Updating..." : "Update Post"}
        </button>
      </p>
    </Form>
  </main>
  );
}
